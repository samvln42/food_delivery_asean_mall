INSERT INTO languages (id, code, name, is_default, is_active, created_at, updated_at) VALUES
(1, 'en', 'English', TRUE, TRUE, NOW(), NOW()),
(2, 'ko', 'Korean', FALSE, TRUE, NOW(), NOW()),
(3, 'th', 'Thai', FALSE, TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  code = VALUES(code),
  name = VALUES(name),
  is_default = VALUES(is_default),
  is_active = VALUES(is_active),
  updated_at = NOW(); 