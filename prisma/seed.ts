import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Subjects ──────────────────────────────────────────────────────────────
  const subjects = [
    { name: "Database Management Systems", code: "DBMS", credits: 4, semester: 5, branch: "Computer Science Engineering", facultyName: "Dr. Ramesh Kumar" },
    { name: "Operating Systems", code: "OS", credits: 4, semester: 5, branch: "Computer Science Engineering", facultyName: "Prof. Anita Sharma" },
    { name: "Computer Networks", code: "CN", credits: 4, semester: 5, branch: "Computer Science Engineering", facultyName: "Dr. Vijay Patel" },
    { name: "Data Structures & Algorithms", code: "DSA", credits: 4, semester: 3, branch: "Computer Science Engineering", facultyName: "Prof. Meera Singh" },
    { name: "Object Oriented Programming (Java)", code: "OOP", credits: 4, semester: 3, branch: "Computer Science Engineering", facultyName: "Dr. Suresh Nair" },
    { name: "Web Technologies", code: "WT", credits: 3, semester: 5, branch: "Computer Science Engineering", facultyName: "Prof. Pooja Gupta" },
    { name: "Machine Learning", code: "ML", credits: 4, semester: 7, branch: "Computer Science Engineering", facultyName: "Dr. Rahul Verma" },
    { name: "Software Engineering", code: "SE", credits: 3, semester: 6, branch: "Computer Science Engineering", facultyName: "Prof. Deepa Iyer" },
    { name: "Engineering Mathematics III", code: "M3", credits: 4, semester: 3, branch: "Computer Science Engineering", facultyName: "Dr. Priya Nambiar" },
    { name: "Theory of Computation", code: "TOC", credits: 4, semester: 5, branch: "Computer Science Engineering", facultyName: "Dr. Anil Joshi" },
  ];

  for (const subject of subjects) {
    await prisma.subject.upsert({
      where: { code: subject.code },
      update: subject,
      create: subject,
    });
  }
  console.log(`✅ Seeded ${subjects.length} subjects`);

  // ── Companies ─────────────────────────────────────────────────────────────
  const companies = [
    { name: "Google India", industry: "Technology", minCgpa: 7.5, allowedBranches: ["Computer Science Engineering", "Information Technology"], package: "₹35-45 LPA", role: "Software Engineer", visitDate: new Date("2025-03-15"), registrationDeadline: new Date("2025-03-01") },
    { name: "Microsoft", industry: "Technology", minCgpa: 7.0, allowedBranches: ["Computer Science Engineering", "Information Technology", "Electronics & Communication"], package: "₹40-50 LPA", role: "SDE-1", visitDate: new Date("2025-03-20"), registrationDeadline: new Date("2025-03-05") },
    { name: "Amazon", industry: "E-Commerce / Cloud", minCgpa: 6.5, allowedBranches: ["Computer Science Engineering", "Information Technology"], package: "₹28-40 LPA", role: "SDE-1", visitDate: new Date("2025-04-01"), registrationDeadline: new Date("2025-03-20") },
    { name: "Infosys", industry: "IT Services", minCgpa: 6.0, allowedBranches: ["Computer Science Engineering", "Information Technology", "Electronics & Communication", "Electrical Engineering"], package: "₹3.6-6.5 LPA", role: "Systems Engineer", visitDate: new Date("2025-02-10") },
    { name: "TCS", industry: "IT Services", minCgpa: 6.0, allowedBranches: ["Computer Science Engineering", "Information Technology", "Electronics & Communication", "Mechanical Engineering", "Civil Engineering"], package: "₹3.36-7 LPA", role: "Assistant System Engineer", visitDate: new Date("2025-02-15") },
    { name: "Wipro", industry: "IT Services", minCgpa: 6.0, allowedBranches: ["Computer Science Engineering", "Information Technology", "Electronics & Communication"], package: "₹3.5-6 LPA", role: "Project Engineer", visitDate: new Date("2025-02-20") },
    { name: "Flipkart", industry: "E-Commerce", minCgpa: 7.0, allowedBranches: ["Computer Science Engineering", "Information Technology"], package: "₹20-30 LPA", role: "SDE-1", visitDate: new Date("2025-03-25") },
    { name: "PhonePe", industry: "Fintech", minCgpa: 7.0, allowedBranches: ["Computer Science Engineering", "Information Technology"], package: "₹18-28 LPA", role: "Software Engineer", visitDate: new Date("2025-04-05") },
  ];

  for (const company of companies) {
    await prisma.company.upsert({
      where: { name: company.name } as any,
      update: company,
      create: company,
    });
  }
  console.log(`✅ Seeded ${companies.length} companies`);

  // ── Quizzes ───────────────────────────────────────────────────────────────
  const dbmsSubject = await prisma.subject.findUnique({ where: { code: "DBMS" } });
  const dsaSubject = await prisma.subject.findUnique({ where: { code: "DSA" } });

  if (dbmsSubject) {
    const dbmsQuiz = await prisma.quiz.upsert({
      where: { title: "DBMS Fundamentals" } as any,
      update: {},
      create: {
        title: "DBMS Fundamentals",
        description: "Test your knowledge of Database Management Systems basics",
        subjectId: dbmsSubject.id,
        difficulty: "MEDIUM",
        timeLimit: 600,
        isPublic: true,
      },
    });

    const dbmsQuestions = [
      { question: "Which normal form eliminates transitive dependencies?", options: ["1NF", "2NF", "3NF", "BCNF"], correctAnswer: "3NF", explanation: "3NF eliminates transitive functional dependencies.", marks: 1 },
      { question: "What does ACID stand for in databases?", options: ["Atomicity, Consistency, Isolation, Durability", "Accuracy, Consistency, Integrity, Durability", "Atomicity, Concurrency, Isolation, Data", "Accuracy, Concurrency, Integrity, Data"], correctAnswer: "Atomicity, Consistency, Isolation, Durability", explanation: "ACID properties ensure reliable database transactions.", marks: 1 },
      { question: "Which join returns all rows from both tables even if there is no match?", options: ["INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL OUTER JOIN"], correctAnswer: "FULL OUTER JOIN", explanation: "FULL OUTER JOIN returns all rows from both tables.", marks: 1 },
      { question: "What is a primary key?", options: ["A key that can have NULL values", "A key that uniquely identifies each record in a table", "A key that references another table", "A composite key"], correctAnswer: "A key that uniquely identifies each record in a table", explanation: "A primary key uniquely identifies each row and cannot be NULL.", marks: 1 },
      { question: "What is a deadlock in DBMS?", options: ["When a query runs slowly", "When two or more transactions wait indefinitely for each other to release locks", "When the database crashes", "When disk space is full"], correctAnswer: "When two or more transactions wait indefinitely for each other to release locks", explanation: "Deadlock is a circular wait condition between transactions.", marks: 1 },
    ];

    await prisma.quizQuestion.deleteMany({ where: { quizId: dbmsQuiz.id } });
    await prisma.quizQuestion.createMany({
      data: dbmsQuestions.map((q) => ({ ...q, quizId: dbmsQuiz.id })),
    });
    console.log("✅ Seeded DBMS quiz with questions");
  }

  if (dsaSubject) {
    const dsaQuiz = await prisma.quiz.upsert({
      where: { title: "DSA Essentials" } as any,
      update: {},
      create: {
        title: "DSA Essentials",
        description: "Core data structures and algorithm concepts",
        subjectId: dsaSubject.id,
        difficulty: "HARD",
        timeLimit: 900,
        isPublic: true,
      },
    });

    const dsaQuestions = [
      { question: "What is the time complexity of Binary Search?", options: ["O(n)", "O(log n)", "O(n²)", "O(1)"], correctAnswer: "O(log n)", explanation: "Binary search divides the search space in half each iteration.", marks: 1 },
      { question: "Which data structure uses LIFO order?", options: ["Queue", "Stack", "Linked List", "Tree"], correctAnswer: "Stack", explanation: "Stack uses Last In First Out (LIFO) ordering.", marks: 1 },
      { question: "What is the worst-case time complexity of Quick Sort?", options: ["O(n log n)", "O(n²)", "O(n)", "O(log n)"], correctAnswer: "O(n²)", explanation: "Quick Sort degrades to O(n²) when the pivot is always the smallest or largest element.", marks: 1 },
      { question: "Which traversal of a BST gives sorted output?", options: ["Pre-order", "Post-order", "In-order", "Level-order"], correctAnswer: "In-order", explanation: "In-order traversal (left, root, right) of a BST gives nodes in sorted order.", marks: 1 },
      { question: "What is the space complexity of Merge Sort?", options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"], correctAnswer: "O(n)", explanation: "Merge Sort requires O(n) auxiliary space for the merge operation.", marks: 1 },
    ];

    await prisma.quizQuestion.deleteMany({ where: { quizId: dsaQuiz.id } });
    await prisma.quizQuestion.createMany({
      data: dsaQuestions.map((q) => ({ ...q, quizId: dsaQuiz.id })),
    });
    console.log("✅ Seeded DSA quiz with questions");
  }

  // ── Mess Menu ─────────────────────────────────────────────────────────────
  const menuData = [
    // Monday
    { dayOfWeek: 1, mealType: "BREAKFAST", items: ["Idli", "Sambar", "Coconut Chutney", "Tea/Coffee"], calories: 350 },
    { dayOfWeek: 1, mealType: "LUNCH", items: ["Rice", "Dal Tadka", "Paneer Butter Masala", "Roti", "Salad", "Papad"], calories: 650 },
    { dayOfWeek: 1, mealType: "SNACKS", items: ["Samosa", "Tea"], calories: 200 },
    { dayOfWeek: 1, mealType: "DINNER", items: ["Chapati", "Aloo Gobi", "Dal Fry", "Rice", "Curd"], calories: 600 },
    // Tuesday
    { dayOfWeek: 2, mealType: "BREAKFAST", items: ["Poha", "Jalebi", "Tea/Coffee"], calories: 380 },
    { dayOfWeek: 2, mealType: "LUNCH", items: ["Rice", "Rajma", "Mixed Veg", "Roti", "Buttermilk"], calories: 700 },
    { dayOfWeek: 2, mealType: "SNACKS", items: ["Bread Pakora", "Ketchup", "Tea"], calories: 250 },
    { dayOfWeek: 2, mealType: "DINNER", items: ["Chapati", "Kadai Paneer", "Dal Makhani", "Rice", "Pickle"], calories: 650 },
    // Wednesday
    { dayOfWeek: 3, mealType: "BREAKFAST", items: ["Upma", "Chutney", "Banana", "Tea/Coffee"], calories: 320 },
    { dayOfWeek: 3, mealType: "LUNCH", items: ["Jeera Rice", "Chana Masala", "Baingan Bharta", "Roti", "Papad", "Curd"], calories: 680 },
    { dayOfWeek: 3, mealType: "SNACKS", items: ["Vada Pav", "Tea"], calories: 300 },
    { dayOfWeek: 3, mealType: "DINNER", items: ["Chapati", "Palak Paneer", "Moong Dal", "Rice", "Salad"], calories: 580 },
    // Thursday
    { dayOfWeek: 4, mealType: "BREAKFAST", items: ["Paratha", "Curd", "Pickle", "Tea/Coffee"], calories: 450 },
    { dayOfWeek: 4, mealType: "LUNCH", items: ["Biryani", "Raita", "Salan", "Papad", "Salad"], calories: 750 },
    { dayOfWeek: 4, mealType: "SNACKS", items: ["Dhokla", "Green Chutney", "Tea"], calories: 180 },
    { dayOfWeek: 4, mealType: "DINNER", items: ["Chapati", "Dal Palak", "Aloo Jeera", "Rice", "Curd"], calories: 590 },
    // Friday
    { dayOfWeek: 5, mealType: "BREAKFAST", items: ["Dosa", "Sambar", "Chutneys", "Tea/Coffee"], calories: 380 },
    { dayOfWeek: 5, mealType: "LUNCH", items: ["Rice", "Dal Tadka", "Matar Paneer", "Roti", "Raita", "Sweet"], calories: 720 },
    { dayOfWeek: 5, mealType: "SNACKS", items: ["Maggi", "Tea"], calories: 350 },
    { dayOfWeek: 5, mealType: "DINNER", items: ["Chapati", "Shahi Paneer", "Dal Fry", "Fried Rice", "Gulab Jamun"], calories: 750 },
    // Saturday
    { dayOfWeek: 6, mealType: "BREAKFAST", items: ["Puri", "Aloo Sabzi", "Tea/Coffee"], calories: 500 },
    { dayOfWeek: 6, mealType: "LUNCH", items: ["Pulao", "Dal", "Kadai Veg", "Roti", "Papad", "Ice Cream"], calories: 800 },
    { dayOfWeek: 6, mealType: "SNACKS", items: ["Pakora", "Chutney", "Tea"], calories: 280 },
    { dayOfWeek: 6, mealType: "DINNER", items: ["Chapati", "Paneer Bhurji", "Dal Makhani", "Rice", "Salad"], calories: 620 },
    // Sunday
    { dayOfWeek: 0, mealType: "BREAKFAST", items: ["Chole Bhature", "Tea/Coffee", "Lassi"], calories: 600 },
    { dayOfWeek: 0, mealType: "LUNCH", items: ["Special Thali", "Rice", "Dal", "2 Sabzis", "Roti", "Sweet", "Papad", "Pickle"], calories: 900 },
    { dayOfWeek: 0, mealType: "SNACKS", items: ["Burger", "Cold Drink"], calories: 420 },
    { dayOfWeek: 0, mealType: "DINNER", items: ["Chapati", "Mix Veg", "Dal Tadka", "Kheer", "Salad"], calories: 650 },
  ];

  for (const menu of menuData) {
    await prisma.messMenu.upsert({
      where: { dayOfWeek_mealType: { dayOfWeek: menu.dayOfWeek, mealType: menu.mealType } },
      update: menu,
      create: menu,
    });
  }
  console.log(`✅ Seeded ${menuData.length} mess menu entries`);

  // ── Clubs ─────────────────────────────────────────────────────────────────
  const clubs = [
    { name: "Google Developer Student Club", description: "Building solutions for local businesses and the community using Google technologies.", category: "Technical", isActive: true },
    { name: "Coding Club", description: "Competitive programming, hackathons, and coding challenges.", category: "Technical", isActive: true },
    { name: "IEEE Student Branch", description: "IEEE student chapter for technical learning and networking.", category: "Technical", isActive: true },
    { name: "Drama & Arts Club", description: "Theatre, fine arts, music, and cultural activities.", category: "Cultural", isActive: true },
    { name: "Sports Club", description: "Cricket, football, badminton, and athletics.", category: "Sports", isActive: true },
    { name: "Entrepreneurship Cell", description: "Fostering startup culture and entrepreneurship among students.", category: "Business", isActive: true },
    { name: "Photography Club", description: "Photography walks, workshops, and exhibitions.", category: "Creative", isActive: true },
    { name: "NSS Unit", description: "National Service Scheme — community service and social initiatives.", category: "Social", isActive: true },
  ];

  for (const club of clubs) {
    const existing = await prisma.club.findFirst({ where: { name: club.name } });
    if (!existing) {
      await prisma.club.create({ data: club });
    }
  }
  console.log(`✅ Seeded ${clubs.length} clubs`);

  // ── Events ────────────────────────────────────────────────────────────────
  const techFest = await prisma.club.findFirst({ where: { name: "Google Developer Student Club" } });
  if (techFest) {
    const events = [
      {
        title: "Hackathon 2025 — Build for Bharat",
        description: "48-hour hackathon focused on solving real-world problems in healthcare, education, and agriculture.",
        clubId: techFest.id,
        location: "Main Auditorium",
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        maxAttendees: 200,
        isPublic: true,
        tags: ["hackathon", "coding", "innovation"],
      },
      {
        title: "Web Dev Workshop — Next.js & Supabase",
        description: "Hands-on workshop on building full-stack applications with Next.js and Supabase.",
        clubId: techFest.id,
        location: "Lab 3 — Computer Centre",
        startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        maxAttendees: 60,
        isPublic: true,
        tags: ["workshop", "nextjs", "web"],
      },
    ];

    for (const event of events) {
      await prisma.event.create({ data: event });
    }
    console.log(`✅ Seeded ${events.length} events`);
  }

  console.log("\n🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });