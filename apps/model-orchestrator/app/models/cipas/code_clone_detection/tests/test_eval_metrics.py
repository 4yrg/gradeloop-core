# tests/test_eval_metrics.py
import pytest
import numpy as np
from typing import List, Set

from ..scripts.eval_metrics import (
    average_precision,
    mean_average_precision,
    recall_at_k,
)

# --- Test Data ---

# Example 1: Perfect retrieval
RETRIEVED_1 = ["doc1", "doc2", "doc3"]
GROUND_TRUTH_1 = {"doc1", "doc2", "doc3"}

# Example 2: Some relevant, some not, perfect order
RETRIEVED_2 = ["doc1", "doc4", "doc2"]
GROUND_TRUTH_2 = {"doc1", "doc2", "doc5"}

# Example 3: Some relevant, some not, bad order
RETRIEVED_3 = ["doc4", "doc1", "doc6", "doc2"]
GROUND_TRUTH_3 = {"doc1", "doc2", "doc5"}

# Example 4: No relevant items
RETRIEVED_4 = ["doc1", "doc2"]
GROUND_TRUTH_4 = {"doc3", "doc4"}

# Example 5: No retrieved items
RETRIEVED_5 = []
GROUND_TRUTH_5 = {"doc1", "doc2"}

# --- Tests for average_precision ---

def test_average_precision_perfect_retrieval():
    ap = average_precision(RETRIEVED_1, GROUND_TRUTH_1)
    assert ap == pytest.approx(1.0)

def test_average_precision_some_relevant_perfect_order():
    # doc1 at rank 1 (1/1)
    # doc2 at rank 3 (2/3)
    # (1/1 + 2/3) / 2 = (1 + 0.666...) / 2 = 1.666... / 2 = 0.833...
    ap = average_precision(RETRIEVED_2, GROUND_TRUTH_2)
    assert ap == pytest.approx(0.8333333333)

def test_average_precision_some_relevant_bad_order():
    # doc1 at rank 2 (1/2)
    # doc2 at rank 4 (2/4)
    # (1/2 + 2/4) / 2 = (0.5 + 0.5) / 2 = 1 / 2 = 0.5
    ap = average_precision(RETRIEVED_3, GROUND_TRUTH_3)
    assert ap == pytest.approx(0.5)

def test_average_precision_no_relevant_found():
    ap = average_precision(RETRIEVED_4, GROUND_TRUTH_4)
    assert ap == pytest.approx(0.0)

def test_average_precision_no_ground_truth():
    ap = average_precision(RETRIEVED_1, set())
    assert ap == pytest.approx(0.0)

def test_average_precision_no_retrieved_items():
    ap = average_precision(RETRIEVED_5, GROUND_TRUTH_1)
    assert ap == pytest.approx(0.0)

# --- Tests for mean_average_precision ---

def test_mean_average_precision_single_query():
    retrieved_list = [RETRIEVED_1]
    ground_truth_list = [GROUND_TRUTH_1]
    map_score = mean_average_precision(retrieved_list, ground_truth_list)
    assert map_score == pytest.approx(1.0)

def test_mean_average_precision_multiple_queries():
    retrieved_list = [RETRIEVED_2, RETRIEVED_3]
    ground_truth_list = [GROUND_TRUTH_2, GROUND_TRUTH_3]
    # AP for RETRIEVED_2, GROUND_TRUTH_2 is 0.833...
    # AP for RETRIEVED_3, GROUND_TRUTH_3 is 0.5
    # MAP = (0.833... + 0.5) / 2 = 1.333... / 2 = 0.666...
    map_score = mean_average_precision(retrieved_list, ground_truth_list)
    assert map_score == pytest.approx(0.6666666666)

def test_mean_average_precision_empty_lists():
    map_score = mean_average_precision([], [])
    assert map_score == pytest.approx(0.0)

# --- Tests for recall_at_k ---

def test_recall_at_k_perfect():
    r_k = recall_at_k([RETRIEVED_1], [GROUND_TRUTH_1], k=3)
    assert r_k == pytest.approx(1.0)

def test_recall_at_k_partial_match():
    # Retrieved: ["doc1", "doc4", "doc2"], GT: {"doc1", "doc2", "doc5"}
    # k=1: ["doc1"]. Relevant: {"doc1"}. Num relevant at k: 1. Total relevant: 3. Recall: 1/3
    r_k = recall_at_k([RETRIEVED_2], [GROUND_TRUTH_2], k=1)
    assert r_k == pytest.approx(1/3)
    
    # k=2: ["doc1", "doc4"]. Relevant: {"doc1"}. Num relevant at k: 1. Total relevant: 3. Recall: 1/3
    r_k = recall_at_k([RETRIEVED_2], [GROUND_TRUTH_2], k=2)
    assert r_k == pytest.approx(1/3)

    # k=3: ["doc1", "doc4", "doc2"]. Relevant: {"doc1", "doc2"}. Num relevant at k: 2. Total relevant: 3. Recall: 2/3
    r_k = recall_at_k([RETRIEVED_2], [GROUND_TRUTH_2], k=3)
    assert r_k == pytest.approx(2/3)

def test_recall_at_k_no_relevant_in_retrieved():
    r_k = recall_at_k([RETRIEVED_4], [GROUND_TRUTH_4], k=2)
    assert r_k == pytest.approx(0.0)

def test_recall_at_k_empty_ground_truth():
    r_k = recall_at_k([RETRIEVED_1], [set()], k=3)
    assert r_k == pytest.approx(0.0)

def test_recall_at_k_empty_retrieved():
    r_k = recall_at_k([RETRIEVED_5], [GROUND_TRUTH_1], k=3)
    assert r_k == pytest.approx(0.0)

def test_recall_at_k_multiple_queries():
    retrieved_list = [RETRIEVED_2, RETRIEVED_3]
    ground_truth_list = [GROUND_TRUTH_2, GROUND_TRUTH_3]
    # For RETRIEVED_2, GROUND_TRUTH_2, k=3: Recall = 2/3
    # For RETRIEVED_3, GROUND_TRUTH_3, k=3: Retrieved: ["doc4", "doc1", "doc6"]. Relevant: {"doc1"}. Recall = 1/3
    # Mean Recall@3 = (2/3 + 1/3) / 2 = 1 / 2 = 0.5
    r_k = recall_at_k(retrieved_list, ground_truth_list, k=3)
    assert r_k == pytest.approx(0.5)
