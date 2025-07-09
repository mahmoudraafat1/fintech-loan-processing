// services/credit-scoring/src/main/java/com/fintech/creditscoring/observer/impl/BureauScoreObserver.java
package com.fintech.creditscoring.observer.impl;

import com.fintech.creditscoring.model.CreditScoreRequest;
import com.fintech.creditscoring.observer.ScoringObserver;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ThreadLocalRandom;

@Component
public class BureauScoreObserver implements ScoringObserver {
    
    @Override
    @Async
    public CompletableFuture<Double> calculateScore(CreditScoreRequest request) {
        // Simulate credit bureau API call
        try {
            Thread.sleep(50); // Simulate network latency
            
            // Mock credit bureau score calculation
            double baseScore = 650;
            double incomeAdjustment = Math.min(request.getMonthlyIncome() / 1000 * 5, 100);
            double debtAdjustment = -Math.min(request.getExistingDebt() / 100 * 2, 50);
            
            double score = baseScore + incomeAdjustment + debtAdjustment;
            return CompletableFuture.completedFuture(Math.max(300, Math.min(850, score)));
            
        } catch (InterruptedException e) {
            return CompletableFuture.completedFuture(0.0);
        }
    }
    
    @Override
    public String getModelName() {
        return "BUREAU_SCORE";
    }
}
