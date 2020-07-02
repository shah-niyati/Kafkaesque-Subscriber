var table = document.getElementById("data");
var player = document.getElementById("serial");

function fetchAnalyticsData() {
    const token = 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJuaXlhdGktc2hhaC1jbGllbnQtNWVjNTE1Y2FlNTFkOCJ9.G6OZ3QpgL4Y4TtUSzvYHGXemwAcZ6swQ4o-_rzyezIWZUwoj7xHucJnUOuCuXPxIF_aWszd4opr9uzTlEOkW_rhErlMx24o7VOnROz1-0vnmw1Nw0xcPDuYMUZzOycUfssbfgytrhF9FpymdEogSP6f5ufGYe7jAP0tXzVVwOW9Sw90FCm9YUoTOlX5LFOZ1gMe6SQcx-H4_CqHnkFyfDpDRiXjwMfjY4hMYv0adgSomncxWp_QfVw1M5QN6UkrwzbpUM6xPwGchKsRsRdnrG5r2ksv2nW_eAabzimV4ajB6Cq1Bo91MYiGTWAkTY7n0URbIlPAInNgQtdlxSDjqIQ';
    const topic = 'wss://uscentral1.azure.kafkaesque.io:8500/ws/v2/consumer/persistent/niyati-shah/local-uscentral1-azure/tc1-messages/sub-1?token=' + token;
    let ws = new WebSocket(topic);
    
    ws.onmessage = function(response) {
        var message = JSON.parse(response.data);

        let data = atob(message['payload']);
        // console.log('Received data is = ' + data);

        ws.send(JSON.stringify({'messageId' : message['messageId']}));
        
        var x =  new Jsontableify({
            headerList: ['systemUsageInfo', 'deviceStatusInfo', 'storageInfo', 'inputSourceInfo', 'deviceUsageInfo', 'firmwareUpgradeInfo'],
            dateFormat: 'DD-MM-YYYY',
            replaceTextMap: { YearsOfExperience: 'Years Of Experience' },
            excludeKeys: ['playerId'],
          }).toHtml(JSON.parse(data).data);

        player.innerHTML = 'Player Serial Number: ' + JSON.parse(data).playerId;
        table.innerHTML += x.html;

        // Add snackbar notification
        var snackbar = document.getElementById("snackbar");
        snackbar.className = 'show';
        // After 3 seconds, remove the notification
        setTimeout( function() { snackbar.className = snackbar.className.replace("show", ""); }, 3000);
    }

    table.innerHTML += '<br>';
}

fetchAnalyticsData();

/* Start of Jsontableify code */

function isValidDate(date) {
    // const regExp = new RegExp('^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(.[0-9]+)?(Z)?$');
  
    // return regExp.test(date);
    return false;
  }
  
  const capitalize = (s) => {
    if (typeof s !== 'string') return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  };
  
  function convert(key) {
    return capitalize(key.replace(/([a-z])([A-Z])/g, '$1 $2'));
  }
  
  class Jsontableify {
    constructor(config = {}) {
      const {
        headerList = [], dateFormat = 'DD-MM-YYYY',
        replaceTextMap = {}, excludeKeys = [],
      } = config;
  
      this.dateFormat = dateFormat;
      this.headerList = headerList;
      this.replaceTextMap = replaceTextMap;
      this.excludeKeys = excludeKeys;
    }
  
    toDate(date) {
      // return moment(new Date(date)).format(this.dateFormat);
      return new Date(date).toUTCString();
    }
  
    jsonToHtml(obj, columns, parentsTmp) {
      const buf = [];
      const type = typeof obj;
      let cols;
  
      const parents = parentsTmp || [];
  
      if (!(type !== 'object' || obj == null || obj === undefined)) {
        // eslint-disable-next-line no-bitwise
        if (~parents.indexOf(obj)) {
          return '[Circular]';
        }
  
        parents.push(obj);
      }
  
      if (Array.isArray(obj)) {
        if (Array.isArray(obj[0]) && obj.every(Array.isArray)) { // array of array
          buf.push('<table>', '<tbody>');
          cols = [];
  
          obj.forEach((row, ix) => {
            cols.push(ix);
  
            row.forEach((val) => {
              buf.push('<tr><td>', this.jsonToHtml(val, cols, parents), '</td></tr>');
            });
          });
  
          buf.push('</tbody>', '</table>');
        } else if (typeof obj[0] === 'object') { // array of objects
          const tmpBuf = [];
          let isNodeEmpty = true;
          tmpBuf.push('<table>', '<tbody>');
          tmpBuf.push('<tr><td>');
  
          obj.forEach((o, i) => {
            if (typeof o === 'object' && !Array.isArray(o)) {
              if (i && !isNodeEmpty) tmpBuf.push('<hr/>');
  
              tmpBuf.push('<table>');
              Object.keys(o)
                .filter(x => (!this.excludeKeys.includes(x)))
                .forEach((k) => {
                  var val = o[k];
                  if (k == 'timeStamp') val = this.toDate(val);
                  // Generate random number between 20 to 30
                  // if (k == 'temperature') val = Math.floor(Math.random() * 6 + 20);
  
                //   if (val) {
                    isNodeEmpty = false;
                    let label = this.replaceTextMap[k] ? this.replaceTextMap[k] : k;
                    label = convert(label);
  
                    tmpBuf.push('<tr><th>', label, '</th>');
                    tmpBuf.push(
                      '<td>',
                      isValidDate(val) ? this.toDate(val) : this.jsonToHtml(val, cols, parents),
                      '</td></tr>',
                    );
                //   }
                });
              tmpBuf.push('</table>');
            }
          });
  
          tmpBuf.push('</td></tr>', '</tbody></table>');
  
          if (!isNodeEmpty) {
            buf.push(...tmpBuf);
          }
        } else { // array of primitives
          buf.push('<table>', '<tbody>');
          cols = [];
  
          obj.forEach((val, ix) => {
            cols.push(ix);
            buf.push('<tr>', '<td>', this.jsonToHtml(val, cols, parents), '</td>', '</tr>');
          });
  
          buf.push('</tbody>', '</table>');
        }
      } else if (
        obj && typeof obj === 'object' && !Array.isArray(obj) && !(obj instanceof Date)
      ) { // object
        const tmpBuf = [];
        let isNodeEmpty = true;
  
        if (!columns) {
          tmpBuf.push('<table>');
          if (obj.type === 'link') {
            isNodeEmpty = false;
            let files = obj.value;
  
            if (!Array.isArray(files)) {
              files = [files];
            }
  
            tmpBuf.push('<td><table>');
  
            // eslint-disable-next-line no-restricted-syntax
            for (const { link, name } of files) {
              tmpBuf.push('<tr><td>');
              tmpBuf.push(`<a href='${link}' target='_blank'>${name}</a></td></tr>`);
            }
  
            tmpBuf.push('</table></td>');
          } else {
            const keys = Object.keys(obj)
              .filter(x => (!this.excludeKeys.includes(x)));
  
            // eslint-disable-next-line no-restricted-syntax
            for (const key of keys) {
              let label = this.replaceTextMap[key] ? this.replaceTextMap[key] : key;
              label = convert(label);
  
              if (key === 'link') {
                isNodeEmpty = false;
                const files = obj[key];
  
                tmpBuf.push(
                  "<tr class='no-break'><th>",
                  label,
                  '</th>',
                  '<td><table>',
                );
  
                // eslint-disable-next-line no-restricted-syntax
                for (const { link, name } of files) {
                  tmpBuf.push('<tr><td>');
                  tmpBuf.push(`<a href='${link}' target=_blank'>${name}</a>`);
                  tmpBuf.push('</td></tr>');
                }
  
                tmpBuf.push('</table></td></tr>');
              } else {
                const x = this.jsonToHtml(obj[key], false, parents);
  
                if (x) {
                  isNodeEmpty = false;
  
                  if (this.headerList.includes(key)) {
                    tmpBuf.push(
                      "<tr class='allow-break'>",
                      "<tr><th class='thead' colspan=2>", label, '</th></tr></td>',
                      '<td colspan=2>', x, '</td>',
                      '</tr>',
                    );
                  } else {
                    tmpBuf.push(
                      "<tr class='no-break'><th>",
                      label,
                      '</th><td>', x, '</td></tr>',
                    );
                  }
                }
              }
            }
          }
  
          tmpBuf.push('</table>');
  
          if (!isNodeEmpty) {
            buf.push(...tmpBuf);
          }
        } else {
          columns.forEach((key) => {
            if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
              buf.push('<td>', this.jsonToHtml(obj[key], false, parents), '</td>');
            } else {
              buf.push('<td>', this.jsonToHtml(obj[key], columns, parents), '</td>');
            }
          });
        }
      } else if (isValidDate(obj)) {
        buf.push(this.toDate(obj));
      } else {
        buf.push(obj);
      }
  
      if (!(type !== 'object' || obj == null || obj === undefined)) {
        parents.pop(obj);
      }
  
      return buf.join('');
    }
  
    toHtml(obj) {
      const html = this.jsonToHtml(obj);
  
      return {
        html,
      };
    }
  }

  /* End of Jsontableify code */