package com.gradeloop.institute.controller;

import com.gradeloop.institute.model.Institute;
import com.gradeloop.institute.service.InstituteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/institutes")
@RequiredArgsConstructor
public class InstituteController {

    private final InstituteService instituteService;

    @PostMapping
    public ResponseEntity<Institute> createInstitute(@RequestBody InstituteService.CreateInstituteRequest request) {
        return ResponseEntity.ok(instituteService.createInstitute(request));
    }
}
