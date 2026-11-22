package com.credvault.credvault_backend.repository;

import com.credvault.credvault_backend.model.Certificate;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CertificateRepository extends JpaRepository<Certificate, String> {
    Optional<Certificate> findByApplicationId(String applicationId);
}