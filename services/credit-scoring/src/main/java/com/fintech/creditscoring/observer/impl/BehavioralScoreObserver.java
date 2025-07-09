// services/credit-scoring/src/main/java/com/fintech/creditscoring/observer/impl/BehavioralScoreObserver.java
package com.fintech.creditscoring.observer.impl;

import com.fintech.creditscoring.model.CreditScoreRequest;
import com.fintech.creditscoring.observer.ScoringObserver;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;

@Component
public class BehavioralScoreObserver implements ScoringObserver {
    
    @Override
    @Async
    public CompletableFuture<Double> calculateScore(CreditScoreRequest request) {
        // Simulate behavioral analysis
        try {
            Thread.sleep(30);
            
            double baseScore = 700;
            double accountAgeBonus = Math.min(request.getAccountAgeMonths() * 2, 50);
            double transactionPatternScore = analyzeTransactionPattern(request);
            
            double score = baseScore + accountAgeBonus + transactionPatternScore;
            return CompletableFuture.completedFuture(Math.max(300, Math.min(850, score)));
            
        } catch (InterruptedException e) {
            return CompletableFuture.completedFuture(0.0);
        }
    }
    
    private double analyzeTransactionPattern(CreditScoreRequest request) {
        // Mock transaction pattern analysis
        return ThreadLocalRandom.current().nextDouble(-20, 50);
    }
    
    @Override
    public String getModelName() {
        return "BEHAVIORAL_SCORE";
    }
}
