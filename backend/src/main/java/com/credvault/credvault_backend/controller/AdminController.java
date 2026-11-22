package com.credvault.credvault_backend.controller;

import com.credvault.credvault_backend.model.Admin;
import com.credvault.credvault_backend.model.Application;
import com.credvault.credvault_backend.model.Certificate;
import com.credvault.credvault_backend.repository.AdminRepository;
import com.credvault.credvault_backend.repository.ApplicationRepository;
import com.credvault.credvault_backend.repository.CertificateRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    private static final String ADMIN_TOKEN = "CREDVAULT-ADMIN-TOKEN";

    private final AdminRepository adminRepository;
    private final ApplicationRepository applicationRepository;
    private final CertificateRepository certificateRepository;

    public AdminController(
            AdminRepository adminRepository,
            ApplicationRepository applicationRepository,
            CertificateRepository certificateRepository) {
        this.adminRepository = adminRepository;
        this.applicationRepository = applicationRepository;
        this.certificateRepository = certificateRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");

        if (username == null || password == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Username and password are required."));
        }

        Optional<Admin> adminOpt = adminRepository.findById(username.trim());
        if (adminOpt.isEmpty() || !adminOpt.get().getPassword().equals(password)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid admin credentials."));
        }

        return ResponseEntity.ok(Map.of(
                "message", "Login successful",
                "username", adminOpt.get().getUsername(),
                "token", ADMIN_TOKEN
        ));
    }

    @GetMapping("/applications")
    public ResponseEntity<?> getAllApplications(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (!isAuthorized(authHeader)) {
            return unauthorizedResponse();
        }
        List<Application> applications = applicationRepository.findAll();
        return ResponseEntity.ok(applications);
    }

    @PatchMapping("/applications/{applicationId}/approve")
    public ResponseEntity<?> approveApplication(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable String applicationId) {
        if (!isAuthorized(authHeader)) {
            return unauthorizedResponse();
        }

        Optional<Application> appOpt = applicationRepository.findById(applicationId);
        if (appOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Application not found with ID: " + applicationId));
        }

        Application application = appOpt.get();
        application.setStatus("Approved");
        applicationRepository.save(application);

        Certificate certificate = certificateRepository.findByApplicationId(applicationId)
                .orElseGet(() -> {
                    Certificate cert = new Certificate();
                    cert.setCertificateId("CERT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
                    cert.setApplicationId(applicationId);
                    cert.setIssuedOn(LocalDateTime.now());
                    return cert;
                });
        certificate.setStatus("Valid");
        Certificate savedCert = certificateRepository.save(certificate);

        return ResponseEntity.ok(Map.of(
                "application", application,
                "certificate", savedCert
        ));
    }

    @PatchMapping("/applications/{applicationId}/reject")
    public ResponseEntity<?> rejectApplication(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable String applicationId) {
        if (!isAuthorized(authHeader)) {
            return unauthorizedResponse();
        }

        Optional<Application> appOpt = applicationRepository.findById(applicationId);
        if (appOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Application not found with ID: " + applicationId));
        }

        Application application = appOpt.get();
        application.setStatus("Rejected");
        applicationRepository.save(application);

        return ResponseEntity.ok(application);
    }

    @GetMapping("/certificates")
    public ResponseEntity<?> getAllCertificates(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (!isAuthorized(authHeader)) {
            return unauthorizedResponse();
        }
        return ResponseEntity.ok(certificateRepository.findAll());
    }

    @GetMapping("/certificates/{certificateId}/revoke")
    public ResponseEntity<?> revokeCertificate(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable String certificateId) {
        if (!isAuthorized(authHeader)) {
            return unauthorizedResponse();
        }

        Optional<Certificate> certOpt = certificateRepository.findById(certificateId);
        if (certOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Certificate not found with ID: " + certificateId));
        }

        Certificate certificate = certOpt.get();
        certificate.setStatus("Revoked");
        Certificate updated = certificateRepository.save(certificate);

        return ResponseEntity.ok(updated);
    }

    private boolean isAuthorized(String authHeader) {
        if (authHeader == null || authHeader.isBlank()) {
            return false;
        }
        String normalized = authHeader.startsWith("Bearer ")
                ? authHeader.substring(7).trim()
                : authHeader.trim();
        return ADMIN_TOKEN.equals(normalized);
    }

    private ResponseEntity<?> unauthorizedResponse() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Unauthorized: valid admin token required."));
    }
}