package com.credvault.credvault_backend.controller;

import com.credvault.credvault_backend.model.Application;
import com.credvault.credvault_backend.repository.ApplicationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/applications")
@CrossOrigin(origins = "*")
public class ApplicationController {

    private final ApplicationRepository applicationRepository;

    public ApplicationController(ApplicationRepository applicationRepository) {
        this.applicationRepository = applicationRepository;
    }

    @PostMapping
    public ResponseEntity<?> submitApplication(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String phone = body.get("phone");
        String gender = body.get("gender");
        String city = body.get("city");
        String state = body.get("state");

        if (isBlank(name) || isBlank(phone) || isBlank(gender) || isBlank(city) || isBlank(state)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "All fields (name, phone, gender, city, state) are required."));
        }

        String applicationId = "APP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Application application = new Application();
        application.setApplicationId(applicationId);
        application.setName(name.trim());
        application.setPhone(phone.trim());
        application.setGender(gender.trim());
        application.setCity(city.trim());
        application.setState(state.trim());
        application.setStatus("Pending");
        application.setSubmittedAt(LocalDateTime.now());

        Application saved = applicationRepository.save(application);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/track/{applicationId}")
    public ResponseEntity<?> trackApplication(@PathVariable String applicationId) {
        Optional<Application> found = applicationRepository.findById(applicationId);
        if (found.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Application not found with ID: " + applicationId));
        }
        return ResponseEntity.ok(found.get());
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}