package security

import (
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"errors"
	"os"
)

// ParseRSAPrivateKeyFromPEM parses a PEM encoded private key
func ParseRSAPrivateKeyFromPEM(keyData []byte) (*rsa.PrivateKey, error) {
	block, _ := pem.Decode(keyData)
	if block == nil {
		return nil, errors.New("failed to parse PEM block containing the key")
	}

	key, err := x509.ParsePKCS1PrivateKey(block.Bytes)
	if err != nil {
		// Try PKCS8
		pkcs8Key, err2 := x509.ParsePKCS8PrivateKey(block.Bytes)
		if err2 != nil {
			return nil, err
		}
		return pkcs8Key.(*rsa.PrivateKey), nil
	}

	return key, nil
}

// ParseRSAPublicKeyFromPEM parses a PEM encoded public key
func ParseRSAPublicKeyFromPEM(keyData []byte) (*rsa.PublicKey, error) {
	block, _ := pem.Decode(keyData)
	if block == nil {
		return nil, errors.New("failed to parse PEM block containing the key")
	}

	pub, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		// Try PKCS1
		pubKey, err2 := x509.ParsePKCS1PublicKey(block.Bytes)
		if err2 != nil {
			return nil, err
		}
		return pubKey, nil
	}

	return pub.(*rsa.PublicKey), nil
}

// LoadPrivateKeyFromFile loads a private key from a file
func LoadPrivateKeyFromFile(path string) (*rsa.PrivateKey, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	return ParseRSAPrivateKeyFromPEM(data)
}

// LoadPublicKeyFromFile loads a public key from a file
func LoadPublicKeyFromFile(path string) (*rsa.PublicKey, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	return ParseRSAPublicKeyFromPEM(data)
}
