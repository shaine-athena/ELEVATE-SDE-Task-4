package com.credvault.credvault_backend.repository;

import com.credvault.credvault_backend.model.Application;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApplicationRepository extends JpaRepository<Application, String> {
}