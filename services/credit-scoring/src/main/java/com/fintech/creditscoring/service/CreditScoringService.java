// services/credit-scoring/src/main/java/com/fintech/creditscoring/service/CreditScoringService.java
package com.fintech.creditscoring.service;

import com.fintech.creditscoring.model.CreditScoreRequest;
import com.fintech.creditscoring.model.CreditScoreResponse;
import com.fintech.creditscoring.observer.ScoringObserver;
import com.fintech.creditscoring.observer.ScoringSubject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Service
public class CreditScoringService implements ScoringSubject {
    
    private final List<ScoringObserver> observers;
    
    @Autowired
    public CreditScoringService(List<ScoringObserver> observers) {
        this.observers = observers;
    }
    
    @Override
    public void registerObserver(ScoringObserver observer) {
        observers.add(observer);
    }
    
    @Override
    public void removeObserver(ScoringObserver observer) {
        observers.remove(observer);
    }
    
    @Override
    public CompletableFuture<CreditScoreResponse> notifyObservers(CreditScoreRequest request) {
        // Execute all scoring models in parallel (5x fan-out as mentioned in paper)
        List<CompletableFuture<Double>> scoreFutures = observers.stream()
                .map(observer -> observer.calculateScore(request))
                .collect(Collectors.toList());
        
        // Combine all scores
        return CompletableFuture.allOf(scoreFutures.toArray(new CompletableFuture[0]))
                .thenApply(v -> {
                    List<Double> scores = scoreFutures.stream()
                            .map(CompletableFuture::join)
                            .collect(Collectors.toList());
                    
                    return aggregateScores(request, scores);
                });
    }
    
    public CompletableFuture<CreditScoreResponse> calculateScore(CreditScoreRequest request) {
        return notifyObservers(request);
    }
    
    private CreditScoreResponse aggregateScores(CreditScoreRequest request, List<Double> scores) {
        // Weighted average of all scoring models
        double finalScore = scores.stream()
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0.0);
        
        return CreditScoreResponse.builder()
                .applicationId(request.getApplicationId())
                .customerId(request.getCustomerId())
                .score(Math.round(finalScore))
                .riskLevel(calculateRiskLevel(finalScore))
                .modelScores(scores)
                .timestamp(System.currentTimeMillis())
                .build();
    }
    
    private String calculateRiskLevel(double score) {
        if (score >= 750) return "LOW";
        if (score >= 650) return "MEDIUM";
        return "HIGH";
    }
}
