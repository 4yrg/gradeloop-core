package com.gradeloop.ivas.service;

import com.gradeloop.ivas.dto.*;
import com.gradeloop.ivas.model.*;
import com.gradeloop.ivas.repository.VivaConceptRepository;
import com.gradeloop.ivas.repository.VivaRubricRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VivaRubricService {

    private final VivaRubricRepository rubricRepository;
    private final VivaConceptRepository conceptRepository;

    @Transactional
    public VivaRubric createRubric(CreateRubricRequest request, Long createdBy) {
        VivaRubric rubric = VivaRubric.builder()
                .assignmentId(request.getAssignmentId())
                .name(request.getName())
                .description(request.getDescription())
                .createdBy(createdBy)
                .status(VivaRubric.RubricStatus.DRAFT)
                .concepts(new ArrayList<>())
                .build();

        // Add concepts if provided
        if (request.getConcepts() != null && !request.getConcepts().isEmpty()) {
            int order = 0;
            for (CreateConceptRequest conceptReq : request.getConcepts()) {
                VivaConcept concept = createConceptFromRequest(conceptReq, rubric, order++);
                rubric.getConcepts().add(concept);
            }
        }

        VivaRubric saved = rubricRepository.save(rubric);
        log.info("Created rubric id={} for assignmentId={}", saved.getId(), request.getAssignmentId());
        return saved;
    }

    private VivaConcept createConceptFromRequest(CreateConceptRequest req, VivaRubric rubric, int defaultOrder) {
        VivaConcept concept = VivaConcept.builder()
                .rubric(rubric)
                .name(req.getName())
                .description(req.getDescription())
                .weight(req.getWeight() != null ? req.getWeight() : 1)
                .displayOrder(req.getDisplayOrder() != null ? req.getDisplayOrder() : defaultOrder)
                .subConcepts(req.getSubConcepts() != null ? new ArrayList<>(req.getSubConcepts()) : new ArrayList<>())
                .relatedCode(req.getRelatedCode())
                .keywords(req.getKeywords() != null ? new ArrayList<>(req.getKeywords()) : new ArrayList<>())
                .questionTemplates(new ArrayList<>())
                .misconceptions(new ArrayList<>())
                .build();

        // Add question templates
        if (req.getQuestionTemplates() != null) {
            for (CreateQuestionTemplateRequest qtReq : req.getQuestionTemplates()) {
                VivaQuestionTemplate template = createQuestionTemplateFromRequest(qtReq, concept);
                concept.getQuestionTemplates().add(template);
            }
        }

        // Add misconceptions
        if (req.getMisconceptions() != null) {
            for (CreateMisconceptionRequest mReq : req.getMisconceptions()) {
                VivaMisconception misconception = createMisconceptionFromRequest(mReq, concept);
                concept.getMisconceptions().add(misconception);
            }
        }

        return concept;
    }

    private VivaQuestionTemplate createQuestionTemplateFromRequest(CreateQuestionTemplateRequest req, VivaConcept concept) {
        return VivaQuestionTemplate.builder()
                .concept(concept)
                .questionText(req.getQuestionText())
                .codeSnippet(req.getCodeSnippet())
                .difficulty(req.getDifficulty() != null ? req.getDifficulty() : VivaQuestionTemplate.DifficultyLevel.INTERMEDIATE)
                .irtDifficulty(req.getIrtDifficulty() != null ? req.getIrtDifficulty() : 0.0)
                .irtDiscrimination(req.getIrtDiscrimination() != null ? req.getIrtDiscrimination() : 1.0)
                .expectedKeywords(req.getExpectedKeywords() != null ? new ArrayList<>(req.getExpectedKeywords()) : new ArrayList<>())
                .sampleAnswer(req.getSampleAnswer())
                .expectedTime(req.getExpectedTime() != null ? req.getExpectedTime() : 120)
                .active(true)
                .build();
    }

    private VivaMisconception createMisconceptionFromRequest(CreateMisconceptionRequest req, VivaConcept concept) {
        return VivaMisconception.builder()
                .concept(concept)
                .misconceptionText(req.getMisconceptionText())
                .detectionKeywords(req.getDetectionKeywords() != null ? new ArrayList<>(req.getDetectionKeywords()) : new ArrayList<>())
                .correction(req.getCorrection())
                .resourceUrl(req.getResourceUrl())
                .severity(req.getSeverity() != null ? req.getSeverity() : VivaMisconception.Severity.MEDIUM)
                .build();
    }

    public VivaRubric getRubric(UUID id) {
        return rubricRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Rubric not found with id: " + id));
    }

    public List<VivaRubric> getRubricsByAssignmentId(UUID assignmentId) {
        return rubricRepository.findByAssignmentId(assignmentId);
    }

    public VivaRubric getActiveRubricByAssignmentId(UUID assignmentId) {
        return rubricRepository.findByAssignmentIdAndStatus(assignmentId, VivaRubric.RubricStatus.ACTIVE)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No active rubric found for assignment: " + assignmentId));
    }

    @Transactional
    public VivaRubric updateRubric(UUID id, UpdateRubricRequest request) {
        VivaRubric rubric = getRubric(id);

        if (request.getName() != null) rubric.setName(request.getName());
        if (request.getDescription() != null) rubric.setDescription(request.getDescription());
        if (request.getVersion() != null) rubric.setVersion(request.getVersion());
        if (request.getStatus() != null) rubric.setStatus(request.getStatus());

        // Handle concepts update if provided
        if (request.getConcepts() != null) {
            updateConcepts(rubric, request.getConcepts());
        }

        log.info("Updated rubric id={}", id);
        return rubricRepository.save(rubric);
    }

    private void updateConcepts(VivaRubric rubric, List<UpdateConceptRequest> conceptRequests) {
        // Get existing concepts by ID for quick lookup
        var existingConcepts = rubric.getConcepts().stream()
                .collect(Collectors.toMap(VivaConcept::getId, c -> c));

        List<VivaConcept> updatedConcepts = new ArrayList<>();
        int order = 0;

        for (UpdateConceptRequest req : conceptRequests) {
            if (req.getId() != null && existingConcepts.containsKey(req.getId())) {
                // Update existing concept
                VivaConcept concept = existingConcepts.get(req.getId());
                updateConceptFromRequest(concept, req, order++);
                updatedConcepts.add(concept);
            } else {
                // Create new concept
                VivaConcept newConcept = createConceptFromUpdateRequest(req, rubric, order++);
                updatedConcepts.add(newConcept);
            }
        }

        rubric.getConcepts().clear();
        rubric.getConcepts().addAll(updatedConcepts);
    }

    private void updateConceptFromRequest(VivaConcept concept, UpdateConceptRequest req, int defaultOrder) {
        if (req.getName() != null) concept.setName(req.getName());
        if (req.getDescription() != null) concept.setDescription(req.getDescription());
        if (req.getWeight() != null) concept.setWeight(req.getWeight());
        concept.setDisplayOrder(req.getDisplayOrder() != null ? req.getDisplayOrder() : defaultOrder);
        if (req.getSubConcepts() != null) concept.setSubConcepts(new ArrayList<>(req.getSubConcepts()));
        if (req.getRelatedCode() != null) concept.setRelatedCode(req.getRelatedCode());
        if (req.getKeywords() != null) concept.setKeywords(new ArrayList<>(req.getKeywords()));

        // Handle question templates update
        if (req.getQuestionTemplates() != null) {
            updateQuestionTemplates(concept, req.getQuestionTemplates());
        }

        // Handle misconceptions update
        if (req.getMisconceptions() != null) {
            updateMisconceptions(concept, req.getMisconceptions());
        }
    }

    private VivaConcept createConceptFromUpdateRequest(UpdateConceptRequest req, VivaRubric rubric, int defaultOrder) {
        VivaConcept concept = VivaConcept.builder()
                .rubric(rubric)
                .name(req.getName())
                .description(req.getDescription())
                .weight(req.getWeight() != null ? req.getWeight() : 1)
                .displayOrder(req.getDisplayOrder() != null ? req.getDisplayOrder() : defaultOrder)
                .subConcepts(req.getSubConcepts() != null ? new ArrayList<>(req.getSubConcepts()) : new ArrayList<>())
                .relatedCode(req.getRelatedCode())
                .keywords(req.getKeywords() != null ? new ArrayList<>(req.getKeywords()) : new ArrayList<>())
                .questionTemplates(new ArrayList<>())
                .misconceptions(new ArrayList<>())
                .build();

        if (req.getQuestionTemplates() != null) {
            for (UpdateQuestionTemplateRequest qtReq : req.getQuestionTemplates()) {
                VivaQuestionTemplate template = createQuestionTemplateFromUpdateRequest(qtReq, concept);
                concept.getQuestionTemplates().add(template);
            }
        }

        if (req.getMisconceptions() != null) {
            for (UpdateMisconceptionRequest mReq : req.getMisconceptions()) {
                VivaMisconception misconception = createMisconceptionFromUpdateRequest(mReq, concept);
                concept.getMisconceptions().add(misconception);
            }
        }

        return concept;
    }

    private void updateQuestionTemplates(VivaConcept concept, List<UpdateQuestionTemplateRequest> templateRequests) {
        var existingTemplates = concept.getQuestionTemplates().stream()
                .collect(Collectors.toMap(VivaQuestionTemplate::getId, t -> t));

        List<VivaQuestionTemplate> updatedTemplates = new ArrayList<>();

        for (UpdateQuestionTemplateRequest req : templateRequests) {
            if (req.getId() != null && existingTemplates.containsKey(req.getId())) {
                VivaQuestionTemplate template = existingTemplates.get(req.getId());
                updateQuestionTemplateFromRequest(template, req);
                updatedTemplates.add(template);
            } else {
                VivaQuestionTemplate newTemplate = createQuestionTemplateFromUpdateRequest(req, concept);
                updatedTemplates.add(newTemplate);
            }
        }

        concept.getQuestionTemplates().clear();
        concept.getQuestionTemplates().addAll(updatedTemplates);
    }

    private void updateQuestionTemplateFromRequest(VivaQuestionTemplate template, UpdateQuestionTemplateRequest req) {
        if (req.getQuestionText() != null) template.setQuestionText(req.getQuestionText());
        if (req.getCodeSnippet() != null) template.setCodeSnippet(req.getCodeSnippet());
        if (req.getDifficulty() != null) template.setDifficulty(req.getDifficulty());
        if (req.getIrtDifficulty() != null) template.setIrtDifficulty(req.getIrtDifficulty());
        if (req.getIrtDiscrimination() != null) template.setIrtDiscrimination(req.getIrtDiscrimination());
        if (req.getExpectedKeywords() != null) template.setExpectedKeywords(new ArrayList<>(req.getExpectedKeywords()));
        if (req.getSampleAnswer() != null) template.setSampleAnswer(req.getSampleAnswer());
        if (req.getExpectedTime() != null) template.setExpectedTime(req.getExpectedTime());
        if (req.getActive() != null) template.setActive(req.getActive());
    }

    private VivaQuestionTemplate createQuestionTemplateFromUpdateRequest(UpdateQuestionTemplateRequest req, VivaConcept concept) {
        return VivaQuestionTemplate.builder()
                .concept(concept)
                .questionText(req.getQuestionText())
                .codeSnippet(req.getCodeSnippet())
                .difficulty(req.getDifficulty() != null ? req.getDifficulty() : VivaQuestionTemplate.DifficultyLevel.INTERMEDIATE)
                .irtDifficulty(req.getIrtDifficulty() != null ? req.getIrtDifficulty() : 0.0)
                .irtDiscrimination(req.getIrtDiscrimination() != null ? req.getIrtDiscrimination() : 1.0)
                .expectedKeywords(req.getExpectedKeywords() != null ? new ArrayList<>(req.getExpectedKeywords()) : new ArrayList<>())
                .sampleAnswer(req.getSampleAnswer())
                .expectedTime(req.getExpectedTime() != null ? req.getExpectedTime() : 120)
                .active(req.getActive() != null ? req.getActive() : true)
                .build();
    }

    private void updateMisconceptions(VivaConcept concept, List<UpdateMisconceptionRequest> misconceptionRequests) {
        var existingMisconceptions = concept.getMisconceptions().stream()
                .collect(Collectors.toMap(VivaMisconception::getId, m -> m));

        List<VivaMisconception> updatedMisconceptions = new ArrayList<>();

        for (UpdateMisconceptionRequest req : misconceptionRequests) {
            if (req.getId() != null && existingMisconceptions.containsKey(req.getId())) {
                VivaMisconception misconception = existingMisconceptions.get(req.getId());
                updateMisconceptionFromRequest(misconception, req);
                updatedMisconceptions.add(misconception);
            } else {
                VivaMisconception newMisconception = createMisconceptionFromUpdateRequest(req, concept);
                updatedMisconceptions.add(newMisconception);
            }
        }

        concept.getMisconceptions().clear();
        concept.getMisconceptions().addAll(updatedMisconceptions);
    }

    private void updateMisconceptionFromRequest(VivaMisconception misconception, UpdateMisconceptionRequest req) {
        if (req.getMisconceptionText() != null) misconception.setMisconceptionText(req.getMisconceptionText());
        if (req.getDetectionKeywords() != null) misconception.setDetectionKeywords(new ArrayList<>(req.getDetectionKeywords()));
        if (req.getCorrection() != null) misconception.setCorrection(req.getCorrection());
        if (req.getResourceUrl() != null) misconception.setResourceUrl(req.getResourceUrl());
        if (req.getSeverity() != null) misconception.setSeverity(req.getSeverity());
    }

    private VivaMisconception createMisconceptionFromUpdateRequest(UpdateMisconceptionRequest req, VivaConcept concept) {
        return VivaMisconception.builder()
                .concept(concept)
                .misconceptionText(req.getMisconceptionText())
                .detectionKeywords(req.getDetectionKeywords() != null ? new ArrayList<>(req.getDetectionKeywords()) : new ArrayList<>())
                .correction(req.getCorrection())
                .resourceUrl(req.getResourceUrl())
                .severity(req.getSeverity() != null ? req.getSeverity() : VivaMisconception.Severity.MEDIUM)
                .build();
    }

    @Transactional
    public void deleteRubric(UUID id) {
        VivaRubric rubric = getRubric(id);
        rubricRepository.delete(rubric);
        log.info("Deleted rubric id={}", id);
    }

    @Transactional
    public VivaRubric activateRubric(UUID id) {
        VivaRubric rubric = getRubric(id);
        
        // Deactivate any currently active rubric for this assignment
        rubricRepository.findByAssignmentIdAndStatus(rubric.getAssignmentId(), VivaRubric.RubricStatus.ACTIVE)
                .ifPresent(activeRubric -> {
                    activeRubric.setStatus(VivaRubric.RubricStatus.ARCHIVED);
                    rubricRepository.save(activeRubric);
                });

        rubric.setStatus(VivaRubric.RubricStatus.ACTIVE);
        log.info("Activated rubric id={}", id);
        return rubricRepository.save(rubric);
    }
}
