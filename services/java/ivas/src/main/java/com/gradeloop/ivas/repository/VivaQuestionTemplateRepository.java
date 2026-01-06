package com.gradeloop.ivas.repository;

import com.gradeloop.ivas.model.VivaQuestionTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VivaQuestionTemplateRepository extends JpaRepository<VivaQuestionTemplate, UUID> {
    
    List<VivaQuestionTemplate> findByConceptIdAndActiveTrue(UUID conceptId);
    
    List<VivaQuestionTemplate> findByConceptIdAndDifficultyAndActiveTrue(
            UUID conceptId, VivaQuestionTemplate.DifficultyLevel difficulty);
    
    List<VivaQuestionTemplate> findByConceptIdIn(List<UUID> conceptIds);
}
