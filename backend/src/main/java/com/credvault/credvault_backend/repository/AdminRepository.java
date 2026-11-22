package com.credvault.credvault_backend.repository;

import com.credvault.credvault_backend.model.Admin;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminRepository extends JpaRepository<Admin, String> {
}