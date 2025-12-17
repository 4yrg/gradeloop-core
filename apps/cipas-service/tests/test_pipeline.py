import unittest
from unittest.mock import MagicMock, patch
import torch
from app.pipeline import CloneDetectionPipeline

class TestPipeline(unittest.TestCase):
    @patch('app.pipeline.AutoTokenizer')
    @patch('app.pipeline.AutoModel')
    def setUp(self, mock_model, mock_tokenizer):
        # Mock the tokenizer
        self.mock_tokenizer_instance = MagicMock()
        self.mock_tokenizer_instance.return_value = {
            "input_ids": torch.tensor([[1, 2, 3]]), 
            "attention_mask": torch.tensor([[1, 1, 1]])
        }
        mock_tokenizer.from_pretrained.return_value = self.mock_tokenizer_instance
        
        # Mock the model
        self.mock_model_instance = MagicMock()
        self.mock_model_instance.config.hidden_size = 768
        self.mock_model_instance.return_value.last_hidden_state = torch.randn(1, 10, 768)
        mock_model.from_pretrained.return_value = self.mock_model_instance
        
        self.pipeline = CloneDetectionPipeline(device="cpu")

    def test_get_embeddings(self):
        code = "public void test() {}"
        emb = self.pipeline.get_embeddings([code])
        self.assertEqual(emb.shape, (1, 768))

    def test_predict_clone_type(self):
        code_a = "void funcA() {}"
        code_b = "void funcB() {}"
        
        # Mock classifier output
        self.pipeline.classifier = MagicMock()
        self.pipeline.classifier.return_value = torch.rand(1, 5) # 5 classes
        self.pipeline.classifier.eval.return_value = None
        
        clone_type, probs = self.pipeline.predict_clone_type(code_a, code_b)
        self.assertIsInstance(clone_type, int)
        self.assertEqual(len(probs), 5)

if __name__ == '__main__':
    unittest.main()
