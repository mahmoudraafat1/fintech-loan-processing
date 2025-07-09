// services/credit-scoring/src/main/java/com/fintech/creditscoring/CreditScoringApplication.java
package com.fintech.creditscoring;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class CreditScoringApplication {
    public static void main(String[] args) {
        SpringApplication.run(CreditScoringApplication.class, args);
    }
}
