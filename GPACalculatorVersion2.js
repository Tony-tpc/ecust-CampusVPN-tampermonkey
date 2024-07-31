// ==UserScript==
// @name         GPA 2.0
// @namespace    http://tampermonkey.net/
// @version      2024-03-03
// @description  try to take over the world!
// @author       You
// @match        https://inquiry-ecust-edu-cn-s.sslvpn.ecust.edu.cn:8118/jsxsd/kscj/xsCjk_find
// @match        https://inquiry.ecust.edu.cn/jsxsd
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ecust.edu.cn
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function () {
    'use strict';

    const tablesize = document.getElementsByClassName('Nsb_r_list_fy3')[0].textContent;
    const condition = /共(\d+)条/;
    const pagination = tablesize.match(condition);
    console.log(pagination);

    function getTableData(pageIndex) {
        return new Promise((resolve, reject) => {
            const url = 'https://inquiry-ecust-edu-cn-s.sslvpn.ecust.edu.cn:8118/jsxsd/kscj/xsCjk_find';

            GM_xmlhttpRequest({
                method: 'POST',
                url: url,
                data: `pageIndex=${pageIndex}`,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    'Accept': "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                },
                onload: function (response) {
                    if (response.status === 200) {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(response.responseText, 'text/html');

                        let M = new Map([[4, 90], [3.7, 85], [3.3, 82], [3, 78], [2.7, 75], [2.3, 71], [1.8, 66], [1.4, 62], [1, 60], [0, 59]]);
                        let gpa = 0.0;
                        let credit = 0.0;
                        let grades = 0.0;

                        const tables = doc.querySelectorAll('.Nsb_r_list');
                        tables.forEach((table) => {
                            const rows = table.querySelectorAll('tr');
                            rows.forEach((row) => {
                                const cells = row.querySelectorAll('td');
                                if (cells[0] != undefined && cells[6].textContent == '必修') {
                                    gpa += parseFloat(cells[4].textContent) * parseFloat(cells[3].textContent);
                                    credit += parseFloat(cells[3].textContent);
                                    if (isNaN(cells[5].textContent)) {
                                        grades += M.get(parseFloat(cells[4].textContent)) * parseFloat(cells[3].textContent);
                                    } else {
                                        grades += parseFloat(cells[5].textContent) * parseFloat(cells[3].textContent);
                                    }
                                }
                            });
                        });
                        console.log(gpa, grades, credit);
                        resolve([gpa, grades, credit]);
                    } else {
                        console.log('请求失败，状态码:', response.status);
                        reject('请求失败');
                    }
                },
                onerror: function (error) {
                    console.log('请求出错:', error);
                    reject(error);
                }
            });
        });
    }

    async function fetchAllData() {
        let GpaAll = 0.0;
        let GradesAll = 0.0;
        let CreditAll = 0.0;

        try {
            const results = await Promise.all(
                Array.from({ length: pagination  }, (_, i) => getTableData(i + 1))
            );

            results.forEach(([gpa, grades, credit]) => {
                GpaAll += gpa;
                GradesAll += grades;
                CreditAll += credit;
            });

            const GPA_Html = `
            <div>
                <p style="font-size:18px;">gpa：${(GpaAll / CreditAll).toFixed(2)}</p>
                <p> </p>
                <p style="font-size:18px;">绩点为${(GradesAll / CreditAll).toFixed(2)}</p>
            </div>
            `;

            function ini_div() {
                const tables = document.getElementById('Form1');
                tables.insertAdjacentHTML('afterend', GPA_Html);
            }

            ini_div();

        } catch (error) {
            console.log('数据获取失败:', error);
        }
    }

    fetchAllData();
})();