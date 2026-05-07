package com.lilluucore.repository;

import com.lilluucore.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.role = 'admin' OR u.role = 'moderator'")
    List<User> findAllStaff();

    List<User> findAllByOrderByCreatedAtDesc();
}
