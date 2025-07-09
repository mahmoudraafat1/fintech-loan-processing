// services/credit-scoring/src/main/java/com/fintech/creditscoring/observer/impl/MachineLearningScoreObserver.java
package com.fintech.creditscoring.observer.impl;

import com.fintech.creditscoring.model.CreditScoreRequest;
import com.fintech.creditscoring.observer.ScoringObserver;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;

@Component
public class MachineLearningScoreObserver implements ScoringObserver {
    
    @Override
    @Async
    public CompletableFuture<Double> calculateScore(CreditScoreRequest request) {
        // Simulate ML model inference
        try {
            Thread.sleep(80); // ML models typically take longer
            
            // Mock ML model prediction
            double[] features = extractFeatures(request);
            double prediction = runMLModel(features);
            
            return CompletableFuture.completedFuture(prediction);
            
        } catch (InterruptedException e) {
            return CompletableFuture.completedFuture(0.0);
        }
    }
    
    private double[] extractFeatures(CreditScoreRequest request) {
        return new double[]{
            request.getMonthlyIncome(),
            request.getExistingDebt(),
            request.getAccountAgeMonths(),
            request.getLoanAmount(),
            request.getLoanTerm()
        };
    }
    
    private double runMLModel(double[] features) {
        // Mock ML model - in production, use TensorFlow or similar
        double sum = 0;
        for (double feature : features) {
            sum += feature * ThreadLocalRandom.current().nextDouble(0.0001, 0.001);
        }
        return Math.max(300, Math.min(850, 600 + sum));
    }
    
    @Override
    public String getModelName() {
        return "ML_SCORE";
    }
}
