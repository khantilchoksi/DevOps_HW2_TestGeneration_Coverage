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

* **Screenshot for Mystery.js branch coverage** 
  * Report: ![img](/mysteryjs_code_coverage.png) 
  * HTML Report: ![img](/mystery_report.png) 


* **For your reference I have put test cases of Subject.js [here](/subject_test.js) and Mystery.js [here](/mystery_test.js).**  

**Thank you!**  
