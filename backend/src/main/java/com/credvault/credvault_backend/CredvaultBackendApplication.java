package com.credvault.credvault_backend;

import com.credvault.credvault_backend.model.Admin;
import com.credvault.credvault_backend.repository.AdminRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class CredvaultBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(CredvaultBackendApplication.class, args);
    }

    @Bean
    public CommandLineRunner seedDefaultAdmin(AdminRepository adminRepository) {
        return args -> {
            if (!adminRepository.existsById("admin")) {
                Admin defaultAdmin = new Admin();
                defaultAdmin.setUsername("admin");
                defaultAdmin.setPassword("admin123");
                adminRepository.save(defaultAdmin);
            }
        };
    }
}