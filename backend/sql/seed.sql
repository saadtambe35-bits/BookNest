-- ============================================================
-- BookNest Seed Data
-- ============================================================
USE booknest;

-- Users (passwords stored in plain text for prototype - admin123 / customer123)
INSERT INTO users (name, email, password, role) VALUES
('Admin User',    'admin@booknest.com',    'admin123',    'ADMIN'),
('John Reader',   'customer@booknest.com', 'customer123', 'CUSTOMER');

-- Categories
INSERT INTO categories (name, description) VALUES
('Fiction',    'Novels, short stories, and imaginative literature'),
('Academic',   'Textbooks, research papers, and scholarly works'),
('Technical',  'Programming, engineering, and technology books'),
('Self-Help',  'Personal development, motivation, and life skills');

-- Books (category_id: 1=Fiction, 2=Academic, 3=Technical, 4=Self-Help)
INSERT INTO books (category_id, title, author, price, stock, description, cover_url) VALUES
(1, 'The Great Gatsby',         'F. Scott Fitzgerald', 299.00,  25, 'A story of wealth, love, and the American Dream set in the roaring 1920s.',          'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop'),
(1, 'To Kill a Mockingbird',    'Harper Lee',          349.00,  18, 'A gripping tale of racial injustice and moral growth in the American South.',         'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop'),
(1, '1984',                     'George Orwell',       319.00,  30, 'A dystopian masterpiece exploring totalitarianism, surveillance, and freedom.',        'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=600&fit=crop'),
(1, 'Pride and Prejudice',      'Jane Austen',         279.00,  22, 'A witty exploration of love, class, and societal expectations in Regency England.',    'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&h=600&fit=crop'),
(2, 'Introduction to Algorithms','Thomas H. Cormen',   899.00,  10, 'The definitive textbook for computer algorithms — used in universities worldwide.',   'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=600&fit=crop'),
(2, 'Operating System Concepts', 'Abraham Silberschatz',749.00, 12, 'Comprehensive coverage of OS design principles, scheduling, and memory management.', 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400&h=600&fit=crop'),
(3, 'Clean Code',               'Robert C. Martin',    599.00,  20, 'A handbook of agile software craftsmanship for writing maintainable, readable code.', 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=600&fit=crop'),
(3, 'The Pragmatic Programmer', 'Andrew Hunt',         649.00,  15, 'Practical advice and insights for software developers at every stage of their career.','https://images.unsplash.com/photo-1587620962725-abab19836100?w=400&h=600&fit=crop'),
(3, 'You Don''t Know JS',       'Kyle Simpson',        449.00,  35, 'A deep-dive series into the core mechanisms of the JavaScript language.',            'https://images.unsplash.com/photo-1621839673705-6617adf9e890?w=400&h=600&fit=crop'),
(3, 'Design Patterns',          'Gang of Four',        699.00,   8, 'The classic catalog of reusable solutions to common software design problems.',       'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=600&fit=crop'),
(4, 'Atomic Habits',            'James Clear',         399.00,  40, 'An easy and proven way to build good habits and break bad ones.',                     'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400&h=600&fit=crop'),
(4, 'The 7 Habits of Highly Effective People','Stephen Covey',449.00, 28,'Powerful lessons in personal change and principled living for lasting effectiveness.','https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=600&fit=crop');

-- Sample reviews
INSERT INTO reviews (book_id, user_id, rating, comment) VALUES
(1,  2, 5, 'A timeless classic. Fitzgerald''s prose is simply beautiful.'),
(2,  2, 5, 'Incredibly moving — a must-read for everyone.'),
(7,  2, 5, 'Changed the way I write code entirely. Highly recommended!'),
(11, 2, 5, 'This book transformed my daily routines. Practical and insightful.');

-- Sample cart for customer
INSERT INTO cart (user_id, book_id, quantity) VALUES
(2, 7, 1),
(2, 11, 2);

-- Sample order for customer
INSERT INTO orders (user_id, total_amount, status) VALUES
(2, 748.00, 'CONFIRMED');

INSERT INTO order_items (order_id, book_id, quantity, price) VALUES
(1, 7, 1, 599.00),
(1, 1, 1, 299.00);

INSERT INTO payments (order_id, amount, status, transaction_ref) VALUES
(1, 748.00, 'SUCCESS', 'TXN_20241005_001');
