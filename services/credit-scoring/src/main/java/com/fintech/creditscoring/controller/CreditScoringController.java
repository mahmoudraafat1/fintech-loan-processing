// services/credit-scoring/src/main/java/com/fintech/creditscoring/controller/CreditScoringController.java
package com.fintech.creditscoring.controller;

import com.fintech.creditscoring.model.CreditScoreRequest;
import com.fintech.creditscoring.model.CreditScoreResponse;
import com.fintech.creditscoring.service.CreditScoringService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/credit-score")
public class CreditScoringController {
    
    @Autowired
    private CreditScoringService creditScoringService;
    
    @PostMapping("/calculate")
    public CompletableFuture<ResponseEntity<CreditScoreResponse>> calculateScore(
            @RequestBody CreditScoreRequest request) {
        return creditScoringService.calculateScore(request)
                .thenApply(ResponseEntity::ok);
    }
    
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("UP");
    }
}
