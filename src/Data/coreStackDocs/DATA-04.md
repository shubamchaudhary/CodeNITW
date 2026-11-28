# SQL queries for interviews

Start each question by asking **what one row of the answer represents**. “List employees with their department names” needs one row per employee. “Count employees in each department” needs one row per department. That choice tells you whether to keep the individual rows or group them.

## The practice tables

**departments**

| id | department |
|---:|---|
| 10 | Engineering |
| 20 | Sales |
| 30 | Support |

**employees**

| id | name | dept_id | manager_id | salary | hired_on |
|---:|---|---:|---:|---:|---|
| 1 | Mira | 10 | NULL | 900 | 2024-01-10 |
| 2 | Asha | 10 | 1 | 1000 | 2025-04-12 |
| 3 | Isha | 10 | 1 | 1000 | 2025-04-12 |
| 4 | Ravi | 20 | NULL | 800 | 2024-02-01 |
| 5 | Dev | 20 | 4 | 600 | 2025-03-08 |

Read Asha’s row from left to right. Department `10` is Engineering. Manager `1` is Mira, another row in `employees`. A `NULL` manager ID means no manager is recorded. To run the examples yourself, use the setup at the end of the page in a PostgreSQL session.

## 1. Sort and limit the result

**Who are the two highest-paid employees?** Return exactly two names. Use the smaller employee ID first when salaries tie.

```sql
SELECT name, salary
FROM employees
ORDER BY salary DESC, id ASC
LIMIT 2;
```

**Result:** Asha (1000), Isha (1000). `DESC` puts larger salaries first. For equal salaries, `ASC` puts the smaller ID first. `LIMIT 2` keeps the first two people. If a third person also earned 1000, the ID would decide who made the cut.

## 2. Match rows with INNER JOIN

**Which department does each employee work in?** The employee row has an ID, but the answer needs the department name.

```sql
SELECT e.name, d.department
FROM employees AS e
JOIN departments AS d ON d.id = e.dept_id
ORDER BY e.id;
```

`e` and `d` are short names for the two tables. For Asha, `e.dept_id` is 10. The `ON` condition finds department 10 and puts Engineering beside her name. A plain `JOIN` is an inner join. Only matching pairs appear.

| name | department |
|---|---|
| Mira | Engineering |
| Asha | Engineering |
| Isha | Engineering |
| Ravi | Sales |
| Dev | Sales |

## 3. Keep empty departments with LEFT JOIN

**How many employees does each department have, including Support?** Start from the table whose rows must all appear.

```sql
SELECT d.department, COUNT(e.id) AS headcount
FROM departments AS d
LEFT JOIN employees AS e ON e.dept_id = d.id
GROUP BY d.id, d.department
ORDER BY d.id;
```

**Result:** Engineering 3, Sales 2, Support 0. The left join keeps Support and fills the employee columns with `NULL`. `GROUP BY` collects each department’s rows into one group. `COUNT(e.id)` counts the employee IDs present. Using `COUNT(*)` here would count Support’s placeholder row and report 1.

## 4. Filter rows with WHERE and groups with HAVING

**Which departments have at least two employees earning 900 or more?**

```sql
SELECT dept_id, COUNT(*) AS qualifying_employees
FROM employees
WHERE salary >= 900
GROUP BY dept_id
HAVING COUNT(*) >= 2;
```

**Result:** department 10, with 3 qualifying employees. Trace the filters in order. `WHERE` keeps Mira, Asha and Isha. `GROUP BY` puts all three in department 10. `HAVING` tests the size of that group. Sales has no qualifying employees, so it never reaches the group filter.

## 5. Find missing matches with NOT EXISTS

**Which departments have no employees?**

```sql
SELECT d.department
FROM departments AS d
WHERE NOT EXISTS (
  SELECT 1 FROM employees AS e WHERE e.dept_id = d.id
);
```

**Result:** Support. For each department, the inner query looks for any employee with that department ID. One match rules out Engineering. Zero matches lets Support through. The `1` is just a constant because `EXISTS` only checks whether a row was found.

## 6. Compare two people with a self-join

**Who earns more than their manager?**

```sql
SELECT e.name AS employee, m.name AS manager
FROM employees AS e
JOIN employees AS m ON m.id = e.manager_id
WHERE e.salary > m.salary
ORDER BY e.id;
```

**Result:** Asha → Mira and Isha → Mira. Read `e` as “employee” and `m` as “their manager.” Asha’s manager ID points to Mira, so the comparison is 1000 > 900. Dev also has a manager, but 600 > 800 is false. [Practice the manager comparison on LeetCode](https://leetcode.com/problems/employees-earning-more-than-their-managers/)

## 7. Find repeated values

**Which salary appears more than once, and how often?**

```sql
SELECT salary, COUNT(*) AS occurrences
FROM employees
GROUP BY salary
HAVING COUNT(*) > 1;
```

**Result:** 1000 appears twice. Group by the value whose repetition matters. Grouping by employee ID here would give five groups of one. The same pattern finds duplicate email addresses when the grouping column is `email`.

## 8. Find the second-highest distinct value with a subquery

**What is the second-highest salary when two people tie for first?**

```sql
SELECT MAX(salary) AS second_highest
FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);
```

**Result:** 900. Work from the inside out. The inner `MAX` returns 1000. The filter removes **both** rows earning 1000. The largest remaining value is 900. If everyone earned the same salary, the outer `MAX` would return one row containing `NULL`. [Practice second-highest salary on LeetCode](https://leetcode.com/problems/second-highest-salary/)

## 9. Count a subset with CASE

**For each staffed department, how many employees are there, and how many earn at least 900?** Both counts must appear on the same row.

```sql
SELECT dept_id, COUNT(*) AS headcount,
       SUM(CASE WHEN salary >= 900 THEN 1 ELSE 0 END) AS earning_900_plus
FROM employees
GROUP BY dept_id
ORDER BY dept_id;
```

| dept_id | headcount | earning_900_plus |
|---:|---:|---:|
| 10 | 3 | 3 |
| 20 | 2 | 0 |

`CASE` gives each employee a 1 or a 0. Sales contributes two rows to the headcount and two zeros to the sum. Putting the salary test in `WHERE` would remove both Sales rows before either count was calculated.

## 10. Combine two lists with UNION

**Who works in Sales or manages someone?** Return each qualifying employee ID once.

```sql
SELECT id FROM employees WHERE dept_id = 20
UNION
SELECT manager_id FROM employees WHERE manager_id IS NOT NULL
ORDER BY id;
```

**Result:** 1, 4, 5. The first query returns Ravi and Dev (4, 5). The second returns the recorded manager IDs (1, 1, 4). `UNION` stacks the two lists and removes repeated rows. With `UNION ALL`, the result would be 1, 1, 4, 4, 5.

## 11. Keep tied salaries with DENSE_RANK

**Who earns one of the top two distinct salaries in each department?** A department can return more than two people.

```sql
WITH ranked AS (
  SELECT dept_id, name, salary,
         DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS place
  FROM employees
)
SELECT dept_id, name, salary, place FROM ranked
WHERE place <= 2
ORDER BY dept_id, place, name;
```

| dept_id | name | salary | place |
|---:|---|---:|---:|
| 10 | Asha | 1000 | 1 |
| 10 | Isha | 1000 | 1 |
| 10 | Mira | 900 | 2 |
| 20 | Ravi | 800 | 1 |
| 20 | Dev | 600 | 2 |

`PARTITION BY dept_id` restarts the ranking for each department. A window function adds a value to each employee row, so names remain available. `WITH ranked AS (...)` gives those rows a name so the outer query can filter on `place`. Engineering’s ranks are **1, 1, 2**. Ordinary `RANK()` would give **1, 1, 3** and the filter would drop Mira.

## 12. Choose one row per group with ROW_NUMBER

**Who is the latest hire in each department?** If two people joined on the same date, choose the one with the larger employee ID.

```sql
WITH hires AS (
  SELECT dept_id, name, ROW_NUMBER() OVER (
    PARTITION BY dept_id ORDER BY hired_on DESC, id DESC
  ) AS position
  FROM employees
)
SELECT dept_id, name FROM hires
WHERE position = 1
ORDER BY dept_id;
```

**Result:** Engineering (10) → Isha, Sales (20) → Dev. `ROW_NUMBER()` gives exactly one row position 1 in each group. Asha and Isha joined on the same day. Isha’s larger ID puts her first. This also solves “latest order per customer” by grouping on customer and sorting on order date and order ID.

## 13. Compare days with a running SUM and LAG

**For each day, what are total sales so far and the change since the previous day?** The three input rows are inside the query. Each row represents one consecutive day.

```sql
WITH sales(day_no, amount) AS (VALUES (1, 100), (2, 60), (3, 90))
SELECT day_no, amount,
       SUM(amount) OVER (ORDER BY day_no ROWS UNBOUNDED PRECEDING) AS total_so_far,
       amount - LAG(amount) OVER (ORDER BY day_no) AS daily_change
FROM sales
ORDER BY day_no;
```

| day_no | amount | total_so_far | daily_change |
|---:|---:|---:|---:|
| 1 | 100 | 100 | NULL |
| 2 | 60 | 160 | -40 |
| 3 | 90 | 250 | 30 |

On day 2, the running sum includes days 1 and 2, so it reads 100 + 60 = 160. `LAG(amount)` looks back one row, so the change is 60 − 100 = −40. Day 1 has no previous row, which makes its change `NULL`.

## Run the examples

Run this setup once in a fresh PostgreSQL session. The temporary tables last for that session. Try predicting each query’s output before running it.

```sql
CREATE TEMP TABLE departments (id integer PRIMARY KEY, department text);
INSERT INTO departments VALUES (10, 'Engineering'), (20, 'Sales'), (30, 'Support');

CREATE TEMP TABLE employees (
  id integer PRIMARY KEY, name text, dept_id integer,
  manager_id integer, salary integer, hired_on date
);
INSERT INTO employees VALUES
  (1, 'Mira', 10, NULL, 900, '2024-01-10'),
  (2, 'Asha', 10, 1, 1000, '2025-04-12'),
  (3, 'Isha', 10, 1, 1000, '2025-04-12'),
  (4, 'Ravi', 20, NULL, 800, '2024-02-01'),
  (5, 'Dev', 20, 4, 600, '2025-03-08');
```
