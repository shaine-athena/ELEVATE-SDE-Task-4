package com.credvault.credvault_backend.controller;

import com.credvault.credvault_backend.model.Application;
import com.credvault.credvault_backend.model.Certificate;
import com.credvault.credvault_backend.repository.ApplicationRepository;
import com.credvault.credvault_backend.repository.CertificateRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/certificates")
@CrossOrigin(origins = "*")
public class CertificateController {

    private final CertificateRepository certificateRepository;
    private final ApplicationRepository applicationRepository;

    public CertificateController(
            CertificateRepository certificateRepository,
            ApplicationRepository applicationRepository) {
        this.certificateRepository = certificateRepository;
        this.applicationRepository = applicationRepository;
    }

    @GetMapping("/verify/{certificateId}")
    public ResponseEntity<?> verifyCertificate(@PathVariable String certificateId) {
        Optional<Certificate> found = certificateRepository.findById(certificateId);
        if (found.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Certificate not found with ID: " + certificateId));
        }

        Certificate cert = found.get();
        Optional<Application> appOpt = applicationRepository.findById(cert.getApplicationId());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("certificateId", cert.getCertificateId());
        response.put("applicationId", cert.getApplicationId());
        response.put("name", appOpt.map(Application::getName).orElse(null));
        response.put("phone", appOpt.map(Application::getPhone).orElse(null));
        response.put("issuedOn", cert.getIssuedOn());
        response.put("status", cert.getStatus());

        return ResponseEntity.ok(response);
    }
}