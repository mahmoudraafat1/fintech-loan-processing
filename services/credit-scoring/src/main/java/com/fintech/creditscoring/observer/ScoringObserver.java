// services/credit-scoring/src/main/java/com/fintech/creditscoring/observer/ScoringObserver.java
package com.fintech.creditscoring.observer;

import com.fintech.creditscoring.model.CreditScoreRequest;
import java.util.concurrent.CompletableFuture;

public interface ScoringObserver {
    CompletableFuture<Double> calculateScore(CreditScoreRequest request);
    String getModelName();
}
