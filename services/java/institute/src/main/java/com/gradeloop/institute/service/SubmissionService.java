package com.gradeloop.institute.service;

import com.gradeloop.institute.model.Assignment;
import com.gradeloop.institute.model.Submission;
import com.gradeloop.institute.repository.AssignmentRepository;
import com.gradeloop.institute.repository.SubmissionRepository;
import io.minio.*;
import io.minio.errors.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubmissionService {
    
    private final SubmissionRepository submissionRepository;
    private final AssignmentRepository assignmentRepository;
    private final MinioClient minioClient;

    @Value("${minio.bucket-name}")
    private String bucketName;

    /**
     * Submit an assignment with a code file
     */
    @Transactional
    public Submission submitAssignment(UUID userId, UUID assignmentId, MultipartFile file) {
        log.info("Processing submission for user: {} and assignment: {}", userId, assignmentId);

        // Validate assignment exists
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found with id: " + assignmentId));

        // Ensure bucket exists
        ensureBucketExists();

        // Generate unique object key for MinIO
        String objectKey = generateObjectKey(userId, assignmentId, file.getOriginalFilename());

        try {
            // Upload file to MinIO
            uploadFileToMinio(objectKey, file);

            // Create submission record
            Submission submission = Submission.builder()
                    .userId(userId)
                    .assignment(assignment)
                    .fileName(file.getOriginalFilename())
                    .fileObjectKey(objectKey)
                    .fileSize(file.getSize())
                    .contentType(file.getContentType())
                    .status(Submission.SubmissionStatus.SUBMITTED)
                    .build();

            Submission savedSubmission = submissionRepository.save(submission);
            log.info("Submission created successfully with id: {}", savedSubmission.getId());

            return savedSubmission;

        } catch (Exception e) {
            log.error("Error uploading file to MinIO", e);
            throw new RuntimeException("Failed to upload submission file", e);
        }
    }

    /**
     * Get all submissions for a user
     */
    public List<Submission> getUserSubmissions(UUID userId) {
        return submissionRepository.findByUserId(userId);
    }

    /**
     * Get all submissions for an assignment
     */
    public List<Submission> getAssignmentSubmissions(UUID assignmentId) {
        return submissionRepository.findByAssignment_Id(assignmentId);
    }

    /**
     * Get a specific submission by id
     */
    public Submission getSubmission(UUID submissionId) {
        return submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found with id: " + submissionId));
    }

    /**
     * Download submission file from MinIO
     */
    public InputStream downloadSubmissionFile(UUID submissionId) {
        Submission submission = getSubmission(submissionId);
        
        try {
            return minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(bucketName)
                            .object(submission.getFileObjectKey())
                            .build()
            );
        } catch (Exception e) {
            log.error("Error downloading file from MinIO", e);
            throw new RuntimeException("Failed to download submission file", e);
        }
    }

    /**
     * Delete a submission (removes from database and MinIO)
     */
    @Transactional
    public void deleteSubmission(UUID submissionId) {
        Submission submission = getSubmission(submissionId);
        
        try {
            // Delete from MinIO
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucketName)
                            .object(submission.getFileObjectKey())
                            .build()
            );
            
            // Delete from database
            submissionRepository.delete(submission);
            log.info("Submission deleted successfully: {}", submissionId);
            
        } catch (Exception e) {
            log.error("Error deleting file from MinIO", e);
            throw new RuntimeException("Failed to delete submission", e);
        }
    }

    /**
     * Upload file to MinIO
     */
    private void uploadFileToMinio(String objectKey, MultipartFile file) throws Exception {
        try (InputStream inputStream = file.getInputStream()) {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectKey)
                            .stream(inputStream, file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build()
            );
            log.info("File uploaded to MinIO successfully: {}", objectKey);
        }
    }

    /**
     * Ensure the bucket exists in MinIO
     */
    private void ensureBucketExists() {
        try {
            boolean exists = minioClient.bucketExists(
                    BucketExistsArgs.builder().bucket(bucketName).build()
            );
            
            if (!exists) {
                minioClient.makeBucket(
                        MakeBucketArgs.builder().bucket(bucketName).build()
                );
                log.info("Created new MinIO bucket: {}", bucketName);
            }
        } catch (Exception e) {
            log.error("Error checking/creating bucket", e);
            throw new RuntimeException("Failed to ensure bucket exists", e);
        }
    }

    /**
     * Generate unique object key for MinIO storage
     */
    private String generateObjectKey(UUID userId, UUID assignmentId, String originalFilename) {
        String timestamp = String.valueOf(System.currentTimeMillis());
        String extension = "";
        
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        
        return String.format("submissions/%s/%s/%s%s", 
                userId, assignmentId, timestamp, extension);
    }
}

