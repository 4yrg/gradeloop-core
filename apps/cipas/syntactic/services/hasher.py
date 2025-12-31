# MD5/SHA fingerprinting for Type-1 & 2 [cite: 125]
import hashlib

class Hasher:
    def compute_hash(self, content: str) -> str:
        """
        Compute MD5/SHA hash of the content.
        """
        return hashlib.md5(content.encode('utf-8')).hexdigest()
