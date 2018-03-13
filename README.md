# DevOps_HW2_TestGeneration_Coverage  

> **Name: Khantil Choksi and Unity ID: khchoksi.**  

## Setup:
 ```config
 git clone https://github.ncsu.edu/khchoksi/DevOps_HW2_TestGeneration_Coverage.git
 cd DevOps_HW2_TestGeneration_Coverage  
 npm install
 npm install istanbul -G
 ```  
 
 * To run and auto-generate test-cases:
  `node main.js`  
  
 * This will create test cases in test.js file and to see the code coverage  
 ```config
 node_modules/.bin/istanbul cover test.js
 ```
 
 * To check the fully automated html report:  
  ```config
 open coverage/lcov-report/DevOps_HW2_TestGeneration_Coverage/subject.js.html
 ```
 
* **Screenshot for Subject.js branch coverage:** 
  * Report: ![img](/subjectjs_code_coverage.png) 
  * HTML Report: ![img](/subject_report.png) 

* **Architecture Diagram:** 
  * Report: ![img](/mysteryjs_code_coverage.png) 
  * HTML Report: ![img](/mystery_report.png) 


**Thank you!**  
