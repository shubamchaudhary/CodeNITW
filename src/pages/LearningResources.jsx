import React, { useState, useEffect } from 'react';
import MarkdownPreview from '@uiw/react-markdown-preview';

export default function LearningResources() {

  const source = `
  

## Introduction
During my whole learning process of various Technologies , Concepts and Frameworks. I have collected a list of resources to help me understand them better. I will be sharing those resources in this blog post. 

## Data Structures and Algorithms 
We assume that you are proficient in any one of the coding Languages,if not we suggest you to try C++.

1. For basics of C++ : 
    [Youtube Vedio](https://www.youtube.com/watch?v=GMx_G05cqYI&list=PLF541C2C1F671AEF6) 


Now that you know a Programming language syntax, let's deep dive into DSA. 

2. C++ Standard Template Library :
    [Youtube Vedio](https://www.youtube.com/watch?v=zBhVZzi5RdU&ab_channel=takeUforward) [Article Link](https://abhiarrathore.medium.com/the-magic-of-c-stl-standard-template-library-e910f43379ea)

    - [Pair](https://www.geeksforgeeks.org/pair-in-cpp-stl/)
    - [Vectors](https://takeuforward.org/c/vector-in-c-stl/)
    - [Map](https://takeuforward.org/c/c-stl/map-in-c-stl/) and [Unordered Map](https://takeuforward.org/c/c-stl/unordered_map-in-c-stl/)
    - [Set](https://takeuforward.org/c/set-in-c-stl/) and [Unordered Set](https://takeuforward.org/c/unordered-set-in-c-stl/)
    - [Priority Queue](https://takeuforward.org/c/c-stl/priority-queue-in-c-stl/)
    - [Stacks](https://takeuforward.org/c/c-stl/stack-in-c-stl/) and [Queue](https://takeuforward.org/c/c-stl/queue-in-c-stl/)
    
3. Linked List : [Youtube Playlist](https://www.youtube.com/playlist?list=PLDzeHZWIZsTr54_TH_NK4ibFojS4mmQA6) & [Problems List](https://leetcode.com/list/pvz15bov)

4. Binary Search : 
    [Youtube Playlist](https://www.youtube.com/playlist?list=PL_z_8CaSLPWeYfhtuKHj-9MpYb6XQJ_f2) & 
    [Problems List](https://leetcode.com/list/pvzlmu3g)

5. Stacks : 
    [Youtube Playlist](https://www.youtube.com/watch?v=P1bAPZg5uaE&ab_channel=AdityaVerma) &
    [Problems List](https://leetcode.com/list/pvzikqdr)

6. [Heaps](https://www.youtube.com/watch?v=hW8PrQrvMNc&ab_channel=AdityaVerma) , Arrays , [Strings](https://www.geeksforgeeks.org/stdstring-class-in-c/)  & Maps : 
    [Problems List](https://leetcode.com/list/pvz3oar6)

7. Recursion :
    [Youtube Playlist](https://www.youtube.com/playlist?list=PLgUwDviBIf0rGlzIn_7rsaR2FQ5e6ZOL9) & [Problems List](https://leetcode.com/list/pvzg7c3t)

8. Trees : 
    [Youtube Playlist](https://www.youtube.com/playlist?list=PLkjdNRgDmcc0Pom5erUBU4ZayeU9AyRRu) & [Problems List](https://leetcode.com/list/pvzsm5jg)

9. Dynamic Programming : 
    [Youtube Playlist](https://www.youtube.com/playlist?list=PLgUwDviBIf0qUlt5H_kiKYaNSqJ81PMMY) & [Problems List](https://leetcode.com/discuss/general-discussion/1000929/solved-all-dynamic-programming-dp-problems-in-7-months)

10. Graphs: 
    [Youtube Playlist](https://www.youtube.com/playlist?list=PLgUwDviBIf0oE3gA41TKO2H5bHpPd7fzn) & [Problems List](https://leetcode.com/discuss/study-guide/1326900/graph-algorithms-problems-to-practice)


## Core CS Fundamentals

### 1. Object Oriented Programming :
  1. OOPS in C++ : [Guide](https://drive.google.com/file/d/1h8dxovjY2QREQT5qq4IvLbGwB2oocPUJ/view?usp=sharing)
  2. OOPS in Java : 
      * [Youtube Tutorials](https://www.youtube.com/watch?v=5NQjLBuNL0I)
      * [Youtube One Shot](https://www.youtube.com/watch?v=bSrm9RXwBaI)
      * [Article ](https://www.freecodecamp.org/news/object-oriented-programming-concepts-java/)


### 2. Database Management System (DBMS)
  1. [Youtube Playlist By Gate Smashers](https://www.youtube.com/playlist?list=PLxCzCOWd7aiFAN6I8CuViBuCdJgiOkT2Y) 
  2. [Youtube Playlist by Sanchit Jain](https://www.youtube.com/playlist?list=PLmXKhU9FNesR1rSES7oLdJaNFgmuj0SYV)
  3. [SQL Cheatsheet](https://www.interviewbit.com/sql-cheat-sheet/)
  4. Practice from here: [InterviewBit](https://www.interviewbit.com/courses/databases/sql-queries/)


  `;

  return (
    <div className="bg-white dark:text-gray-200 min-h-screen p-4 flex justify-center">
  <div className="w-full sm:w-3/4 bg-white shadow-md rounded-lg p-4">
    <MarkdownPreview source={source}
    wrapperElement={{
          "data-color-mode": "light"
        }}
    />
  </div>
</div>
  );
}