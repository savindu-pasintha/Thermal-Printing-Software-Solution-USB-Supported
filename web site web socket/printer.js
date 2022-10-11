
function stringEndToAddSpace(n, l) {
  var space = "\x20";
  var nm = "";
  nm = n;
  for (var x = 0; x < (l - n.length); x++) {
    nm = nm + space;
  }
  return nm;

}

function stringFrontToAddSpace(n, l) {
  var space = "\x20";
  var nm = "";
  for (var x = 0; x < l; x++) {
    nm = nm + space;
  }
  return nm + n;

}

/*
$(document).on("click", "#software_customiz_list,#setting_printer", function () {
  $('#printersetup').show();
  $('#home_screen_layout,#item_cart_layout,#Language_layout,#Screenlock_layout').hide();
  LOAD_PRINTER_SETUP();

})
*/

/**THIS ONE USED FOR THE REFRESH THROUGH THE ACCESS THE PRINTER NAMES */
$(document).on("click", "._refresh", function () {
  var wscp;
  console.log("btnCharge woking");

  if ("WebSocket" in window) {
    // init the websocket client ws://localhost:6690/add
    wscp = new WebSocket("ws://127.0.0.1:7890/PRINTERS");
    wscp.onopen = function () {
      $('#select_printer').empty();
      console.log("/PRINTERS : connected");
      wscp.send(JSON.stringify({ name: "get printers" }));

    };
    wscp.onclose = function () {
      console.log("/PRINTERS : closed");
      $.confirm({
        boxWidth: '30%',
        useBootstrap: false,
        Class: 'box',
        title: 'Error!',
        content: 'Printer connection is closed',
        buttons: {
          OK: {
            text: "OK",

          },

        }
      });
    };

    /** ACCESS THE PRINTER NAMES */
    wscp.onmessage = function (e) {
      console.log("wscp.onmessage() :  ws://127.0.0.1:7890/PRINTERS :", e?.data);
      /*
      var option = document.createElement("option");
      option.text = e.data;
      option.value = e.data;
      var select = document.getElementById("select_printer");
      select.appendChild(option);
      LOAD_PRINTER_SETUP();
      */
    };
  }
})


function AUTO_INVOICE_PRINT(wscp) {
  /* var r = indexedDB.open(db_name);
   r.onsuccess = function (event) {
     var db = event.target.result;
     var printer_name = '';
     var paper_size = '';
     var profile_data = [];
     var customer_data = [];//print_invoice_id
     var inv_main_id = sessionStorage.getItem('print_invoice_id');
     var invoice_type1 = [];
     var invoice_type2 = [];
     var invoice_type3 = [];
     var invoice_type4 = [];//WEB_POS_currency_prefix
     var profile_notes = '';
     var cashier = sessionStorage.getItem('user_name');
     var curreny_prefix = sessionStorage.getItem('WEB_POS_currency_prefix')
     if (cashier == '') {
       cashier = 'admin';
     }
     var imageBase64 = '';
 
     var tax_code = []
     var tax_value = []
     var tax_itemcode = []
     var tax_percentage = []
     var tax_type = []
     var tax_line_no = [];
     var total_line_discount = 0;
     var tax_include_price = 0;
     var tax_exclude_price = 0;
     var charge_include = 0;
     var charge_exclude = 0;
     var total_tax = 0;
     var subtotal = 0;
     var line_num = 0;
     var invoiceItemCode = 0;
     var invoiceItemValue = 0;
     var customer_signature = 0;
     var objectStore_printer = db.transaction(['printer_settings'], 'readwrite')
       .objectStore('printer_settings');
 
 
     objectStore_printer.openCursor().onsuccess = function (event) {
 
       var cursor = event.target.result;
       if (cursor) {
 
         printer_name = cursor.value.printer_name
 
         paper_size = cursor.value.paper_size
 
         cursor.continue();
       }
     }
 
     var paymentTypes = [];
     var objectStoreInvoicePayment = db.transaction(['invoice_payment'], 'readwrite')
       .objectStore('invoice_payment').openCursor();
 
     objectStoreInvoicePayment.onsuccess = function (event) {
       var cursor = event.target.result;
       if (cursor) {
 
 
         paymentTypes.push(cursor.value);
 
         cursor.continue();
 
       }
 
     }
 
     var objectsystem_profile_common_data = db.transaction(['system_profile_common_data'], 'readwrite')
       .objectStore('system_profile_common_data').openCursor();
 
     objectsystem_profile_common_data.onsuccess = function (event) {
       var cursor = event.target.result;
       if (cursor) {
 
         if (cursor.value.code == 1) {
           invoiceItemCode = cursor.value.value;
         }
 
         if (cursor.value.code == 2) {
           invoiceItemValue = cursor.value.value;
         }
 
 
         cursor.continue();
 
       }
 
     }
 
     var print_arr = [];
 
     print_arr.push({
       value: '', bold: true, underline: true, newLines: 0, align: "center", separator: "-", logoBase64String: "", barcode: "", qrcode: "", fontType: "E"
       , size: 3, autoCut: false
     })
     var objectStore_printer = db.transaction(['system_profile'], 'readwrite')
       .objectStore('system_profile');
 
 
     objectStore_printer.openCursor().onsuccess = function (event) {
 
       var cursor = event.target.result;
       if (cursor) {
 
 
         profile_data.push(cursor.value);
         profile_notes = cursor.value.profile_notes;
         imageBase64 = cursor.value.invoice_logo;
         line_num = cursor.value.invItemNo;
         customer_signature = cursor.value.customer_signature;
         cursor.continue();
       } else {
         // console.log(profile_data[0]['profile_address']);
         var profile_address_lines = profile_data[0]['profile_address'];
         var alllength = profile_data[0]['profile_address'].split("\n");
         profile_address_lines.trim();
 
 
         if (profile_data[0]['profile_address'] != '') {
           for (r = 0; r < alllength.length; r++) {
 
             print_arr.push({ value: alllength[r].trim(), bold: false, underline: false, newLines: 1, align: "center", logoBase64String: "", barcode: "", qrcode: "", separator: "", fontType: "A", size: 2, autoCut: false })
           }
         }
 
         if (profile_data[0]['profile_phone'] != '') {
           print_arr.push({ value: profile_data[0]['profile_phone'], bold: false, underline: false, newLines: 0, align: "center", separator: '', logoBase64String: "", barcode: "", qrcode: "", fontType: "A", size: 1, autoCut: false })
         }
 
         print_arr.push({ value: '', bold: true, underline: true, newLines: 0, align: "center", separator: "-", logoBase64String: "", barcode: "", qrcode: "", fontType: "A", size: 3, autoCut: false })
 
         print_arr.push({ value: '' + stringEndToAddSpace(getLanguage(this, 'lang_receipt'), 12) + ':' + inv_main_id + '', bold: false, underline: false, newLines: 0, align: "left", separator: "", logoBase64String: "", barcode: "", qrcode: "", fontType: "A", size: 3, autoCut: false })
         print_arr.push({ value: '' + stringEndToAddSpace(getLanguage(this, 'lang_user_invoice'), 12) + ':' + cashier + '', bold: false, underline: false, newLines: 0, align: "left", separator: "", logoBase64String: "", barcode: "", qrcode: "", fontType: "A", size: 3, autoCut: false })
 
 
       }
     }
 
 
 
     var printer_customer = db.transaction(['customer'], 'readwrite')
       .objectStore('customer');
 
 
     printer_customer.openCursor().onsuccess = function (event) {
 
       var cursor = event.target.result;
       if (cursor) {
 
         customer_data.push(cursor.value);
         cursor.continue();
       }
     }
 
 
     var objectStore = db.transaction(['invoice_tax'], 'readwrite')
       .objectStore('invoice_tax');
 
     objectStore.openCursor().onsuccess = function (event) {
 
       var cursor = event.target.result;
 
       if (cursor) {
 
 
         if (cursor.value.invoice_main_number == "" + inv_main_id + "") {
 
 
           tax_code.push(cursor.value.tax_code);
           tax_value.push(cursor.value.item_tax);
           tax_itemcode.push(cursor.value.invoice_itemcode);
           tax_percentage.push(cursor.value.tax_percentage);
           tax_type.push(cursor.value.tax_type);
           tax_line_no.push(cursor.value.invoice_line_no);
 
         }
 
 
         cursor.continue();
       }
     }
 
 
     var print_invoice = db.transaction(['invoice'], 'readwrite')
       .objectStore('invoice');
     var getspace = ' '.repeat(7);
     if (paper_size == '80') {
       getspace = ' '.repeat(14);
     }
     print_invoice.openCursor().onsuccess = function (event) {
 
       var cursor = event.target.result;
       if (cursor) {
 
         if (cursor.value.invoice_main_number == inv_main_id) {
 
           if (cursor.value.invoice_itemtype_number == 1) {
             invoice_type1.push(cursor.value);
           } else if (cursor.value.invoice_itemtype_number == 2) {
             invoice_type2.push(cursor.value);
           } else if (cursor.value.invoice_itemtype_number == 3) {
             invoice_type3.push(cursor.value);
           } else if (cursor.value.invoice_itemtype_number == 4) {
             invoice_type4.push(cursor.value);
           } else { }
 
 
         }
 
         cursor.continue();
       } else {
 
         if (invoice_type1[0]['invoice_customer_id'] != 'COM1') {
           for (i = 0; i < customer_data.length; i++) {
             if (customer_data[i].customer_id == invoice_type1[0]['invoice_customer_id']) {
               print_arr.push({ value: '' + stringEndToAddSpace(getLanguage(this, 'lang_invoice_customer'), 12) + ':' + customer_data[i].customer_name + ' ' + customer_data[i].customer_last_name + '', bold: true, underline: false, newLines: 0, align: "left", separator: "", logoBase64String: "", barcode: "", qrcode: "", fontType: "A", size: 3, autoCut: false })
             }
           }
         }
         // print_arr.push({value:''+stringEndToAddSpace(getLanguage(this,'lang_date'),12)+':'+invoice_type1[0]['invoice_date_time']+'', bold: true, underline: false, newLines: 0, align: "left", separator: "", logoBase64String: "", barcode: "", qrcode: "", fontType: "E", size: 3, autoCut: false})
 
         print_arr.push({ value: '' + stringEndToAddSpace(getLanguage(this, 'lang_date'), 12) + ':' + invoice_type1[0]['invoice_date_time'] + '', bold: false, underline: false, newLines: 0, align: "left", separator: "", logoBase64String: "", barcode: "", qrcode: "", fontType: "A", size: 3, autoCut: false })
 
         print_arr.push({ value: '', bold: false, underline: false, newLines: 0, align: "center", separator: "-", logoBase64String: "", barcode: "", qrcode: "", fontType: "A", size: 3, autoCut: false })
 
         print_arr.push({ value: '' + stringEndToAddSpace(getLanguage(this, 'lang_item_price'), 19) + stringEndToAddSpace(getLanguage(this, 'lang_print_qty'), 4) + stringFrontToAddSpace(getLanguage(this, 'lang_total'), 12) + '(' + curreny_prefix + ')', bold: false, underline: false, newLines: 0, align: "left", separator: "-", logoBase64String: "", barcode: "", qrcode: "", fontType: "A", size: 3, autoCut: false })
 
 
         for (i = 0; i < invoice_type1.length; i++) {
 
           // invoiceItemCode=0;
           // invoiceItemValue=0;
           var discount = invoice_type1[i]['invoice_reference_value'].split('/');
           var product_name = alasql('SELECT product_name FROM ? where product_code="' + invoice_type1[i]['invoice_itemcode'] + '" AND product_status ="1"', [load_product_arr]);
           var line_number = "";
           var num = 19;
           var line_space = 0;
           var invoice_item_value = '';
           var invoice_item_code = '';
           var invoiceItemcode = invoice_type1[i]['invoice_itemcode'];
           // if(line_num==1){
           //    line_number=(i+1)+':';
           //    num=16;
           //    line_space=3;
           // }
           var productitem_name = '';
           if (line_num == 1) {
 
             line_number = (i + 1) + '.';
             line_space = 2;
 
           }
           if (invoiceItemCode == 1) {
 
             invoice_item_code = invoiceItemcode + '-';
 
           }
           if (invoiceItemValue == 1) {
 
             invoice_item_value = product_name[0]['product_name'];
           }
 
           var productitem_name = line_number + invoice_item_code + invoice_item_value;
 
           // if(length_all.length > 19){
           // var nCLength = (line_number+invoice_item_code).length;
 
           // length_all=line_number+invoice_item_code+invoice_item_value;
           // }
           //  var productitem_name=stringEndToAddSpace(length_all, num);
 
           var productitem_qty = stringEndToAddSpace(invoice_type1[i]['invoice_qty'], 4);
           // var productitem_total_price=stringFrontToAddSpace(number_format(invoice_type1[i]['invoice_price'] * invoice_type1[i]['invoice_qty']), 14);
           var tPrice = number_format(invoice_type1[i]['invoice_price'] * invoice_type1[i]['invoice_qty']);
           var productitem_total_price = stringFrontToAddSpace("", 12) + stringFrontToAddSpace(tPrice, 10 - tPrice.length);
 
           print_arr.push({ value: "" + productitem_name + "", bold: false, underline: false, logoBase64String: "", newLines: 1, align: "left", separator: "", barcode: "", qrcode: "", fontType: "A", size: 3, autoCut: false })
           //print_arr.push({value:""+tPrice + productitem_qty + productitem_total_price+"", bold: false, underline: false, logoBase64String: "", newLines: 1, align: "left", separator: "", barcode: "", qrcode: "", fontType: "A", size: 3, autoCut: false })
 
           // print_arr.push({value:""+productitem_name + productitem_qty + productitem_total_price+"", bold: false, underline: false, logoBase64String: "", newLines: 1, align: "left", separator: "", barcode: "", qrcode: "", fontType: "A", size: 3, autoCut: false })
           // print_arr.push({value:""+stringFrontToAddSpace(number_format(invoice_type1[i]['invoice_price']), line_space)+stringFrontToAddSpace(number_format(invoice_type1[i]['invoice_price']), line_space)+"", bold: false, underline: false, logoBase64String: "", newLines: 1, align: "left", separator: "", barcode: "", qrcode: "", fontType: "A", size: 3, autoCut: false })
           print_arr.push({ value: "" + stringEndToAddSpace(stringFrontToAddSpace(number_format(invoice_type1[i]['invoice_price']), line_space), 19) + stringEndToAddSpace(number_format(invoice_type1[i]['invoice_qty']), 8) + stringFrontToAddSpace(tPrice, 8) + "", bold: false, underline: false, logoBase64String: "", newLines: 1, align: "left", separator: "", barcode: "", qrcode: "", fontType: "A", size: 3, autoCut: false })
           print_arr.push({ value: "", bold: false, underline: false, logoBase64String: "", newLines: 1, align: "left", separator: "", barcode: "", qrcode: "", fontType: "A", size: 3, autoCut: false })
 
 
 
           //  // console.log(product_name[0]['product_name'].length);
           //  print_arr.push({value:""+line_number+stringEndToAddSpace(product_name[0]['product_name'], 19)+stringEndToAddSpace(invoice_type1[i]['invoice_qty'], 4)+getspace+number_format(invoice_type1[i]['invoice_price'] * invoice_type1[i]['invoice_qty'])+"", bold: false, underline: false, logoBase64String: "", newLines: 1, align: "center", separator: "", barcode: "", qrcode: "", fontType: "A", size: 3, autoCut: false })
           //  print_arr.push({value:""+number_format(invoice_type1[i]['invoice_price'])+"", bold: false, underline: false, logoBase64String: "", newLines: 1, align: "left", separator: "", barcode: "", qrcode: "", fontType: "A", size: 3, autoCut: false })
 
 
           if ((invoice_type1[i]['invoice_discount'] > 0) && (invoice_type1[i]['invoice_discount'] != undefined) && (invoice_type1[i]['invoice_discount'] != null)) {
             var vl_type = "%";
             if (invoice_type1[i]['invoice_value_type'] != 'Percentage') {
               vl_type = '';
             }
             print_arr.push({ value: stringFrontToAddSpace("-" + getLanguage(this, 'lang_discount') + "(" + (number_format(discount[1]) + "" + vl_type + "") + "):" + number_format(invoice_type1[i]['invoice_discount']) + "", line_space), bold: false, underline: false, logoBase64String: "", newLines: 1, align: "left", separator: "", barcode: "", qrcode: "", fontType: "A", size: 3, autoCut: false })
           }
 
 
           subtotal = subtotal + parseFloat(invoice_type1[i]['invoice_price']) * invoice_type1[i]['invoice_qty'];
           total_line_discount = total_line_discount + parseFloat(invoice_type1[i]['invoice_discount']);
           var taxCode = 0;
           var taxValue = 0;
           var taxPer = 0;
           var totalIncluded = 0;
           tax_itemcode.reduce(function (a, e, x) {
 
             if ((e == invoice_type1[i]['invoice_itemcode']) && (invoice_type1[i]['invoice_line_no'] == tax_line_no[x])) {
               taxCode = tax_code[x];
               taxValue = tax_value[x];
               taxPer = tax_percentage[x];
 
               if (tax_type[x] == 1) {
                 tax_exclude_price = tax_exclude_price + parseFloat(taxValue);
 
                 print_arr.push({ value: stringFrontToAddSpace("+" + taxCode + "(" + taxPer + "%):(" + number_format(taxValue) + ")", line_space), bold: false, underline: false, logoBase64String: "", newLines: 1, align: "left", separator: "", barcode: "", qrcode: "", fontType: "A", size: 3, autoCut: false })
 
               } else {
                 tax_include_price = tax_include_price + parseFloat(taxValue);
                 print_arr.push({ value: stringFrontToAddSpace("+" + taxCode + "(" + taxPer + "%):(" + number_format(taxValue) + "-" + getLanguage(this, 'lang_include') + ")", line_space), bold: false, underline: false, logoBase64String: "", newLines: 1, align: "left", separator: "", barcode: "", qrcode: "", fontType: "A", size: 3, autoCut: false })
 
               }
 
             }
           }, []);
           print_arr.push({ value: "", bold: false, underline: false, logoBase64String: "", newLines: 2, align: "left", separator: "", barcode: "", qrcode: "", fontType: "A", size: 3, autoCut: false })
 
         }
 
 
         print_arr.push({ value: "", bold: false, underline: false, logoBase64String: "", newLines: 1, align: "left", separator: "-", barcode: "", qrcode: "", fontType: "A", size: 3, autoCut: false })
 
 
         print_arr.push({ value: "" + stringEndToAddSpace(getLanguage(this, 'lang_subtotals') + "(" + curreny_prefix + ")", 35) + stringFrontToAddSpace(number_format(subtotal), 10 - number_format(subtotal).length) + "", bold: false, underline: false, logoBase64String: "", newLines: 1, align: "left", separator: "", barcode: "", qrcode: "", fontType: "A", size: 3, autoCut: false })
 
         if (total_line_discount > 0) {
           print_arr.push({ value: "" + stringEndToAddSpace(getLanguage(this, 'Total_Line_Discount') + "(" + curreny_prefix + ")", 35) + stringFrontToAddSpace(number_format(total_line_discount), ((10 - number_format(total_line_discount).length))) + "", bold: false, underline: false, logoBase64String: "", newLines: 1, align: "left", separator: "", barcode: "", qrcode: "", fontType: "A", size: 3, autoCut: false })
         }
 
         if (tax_include_price > 0) {
           print_arr.push({ value: "" + stringEndToAddSpace(getLanguage(this, 'lang_tax_include') + "(" + curreny_prefix + ")", 35) + stringFrontToAddSpace(number_format(tax_include_price), ((10 - number_format(tax_include_price).length))) + "", bold: false, underline: false, logoBase64String: "", newLines: 1, align: "left", separator: "", barcode: "", qrcode: "", fontType: "A", size: 3, autoCut: false })
         }
         if (tax_exclude_price > 0) {
           print_arr.push({ value: "" + stringEndToAddSpace(getLanguage(this, 'lang_tax_exclude') + "(" + curreny_prefix + ")", 35) + stringFrontToAddSpace(number_format(tax_exclude_price), ((10 - number_format(tax_exclude_price).length))) + "", bold: false, underline: false, logoBase64String: "", newLines: 1, align: "left", separator: "", barcode: "", qrcode: "", fontType: "A", size: 3, autoCut: false })
         }
 
         if (invoice_type3[0]['invoice_price'] > 0) {
           print_arr.push({ value: "" + stringEndToAddSpace(getLanguage(this, 'lang_tdiscount') + "(" + invoice_type3[0]['invoice_reference_value'] + "%)" + "(" + curreny_prefix + ")", 35) + stringFrontToAddSpace(number_format(invoice_type3[0]['invoice_price']), ((10 - number_format(invoice_type3[0]['invoice_price']).length))) + "", bold: false, underline: false, logoBase64String: "", newLines: 1, align: "left", separator: "", barcode: "", qrcode: "", fontType: "A", size: 3, autoCut: false })
         }
         for (z = 0; z < invoice_type2.length; z++) {
 
           var inv_type = "%";
           if (invoice_type2[z]['invoice_value_type'] != 'Percentage') {
             inv_type = "";
           }
           if (invoice_type2[z]['invoice_tax_mode'] == 'Include') {
 
 
             print_arr.push({ value: stringEndToAddSpace(invoice_type2[z]['invoice_itemcode'] + "-" + invoice_type2[z]['invoice_tax_mode'] + "(" + invoice_type2[z]['invoice_reference_value'] + inv_type + ")" + "(" + curreny_prefix + ")", 35) + stringFrontToAddSpace(number_format(invoice_type2[z]['invoice_price']), ((10 - number_format(invoice_type2[z]['invoice_price']).length))) + "", bold: false, underline: false, logoBase64String: "", newLines: 1, align: "left", separator: "", barcode: "", qrcode: "", fontType: "A", size: 3, autoCut: false })
 
           } else {
 
             print_arr.push({ value: stringEndToAddSpace(invoice_type2[z]['invoice_itemcode'] + "(" + invoice_type2[z]['invoice_reference_value'] + inv_type + ")" + "(" + curreny_prefix + ")", 35) + stringFrontToAddSpace(number_format(invoice_type2[z]['invoice_price']), ((10 - number_format(invoice_type2[z]['invoice_price']).length))) + "", bold: false, underline: false, logoBase64String: "", newLines: 1, align: "left", separator: "", barcode: "", qrcode: "", fontType: "A", size: 3, autoCut: false })
 
 
           }
         }
 
         for (y = 0; y < invoice_type4.length; y++) {
 
 
           print_arr.push({ value: stringEndToAddSpace(invoice_type4[y]['invoice_itemcode'] + "(" + invoice_type4[y]['invoice_reference_value'] + "%)" + "(" + curreny_prefix + ")", 35) + stringFrontToAddSpace(number_format(invoice_type4[y]['invoice_price']), ((10 - number_format(invoice_type4[y]['invoice_price']).length))) + "", bold: false, underline: false, logoBase64String: "", newLines: 1, align: "left", separator: "", barcode: "", qrcode: "", fontType: "A", size: 3, autoCut: false })
 
 
         }
 
         print_arr.push({ value: '', bold: true, underline: false, newLines: 0, align: "center", separator: "-", logoBase64String: "", barcode: "", qrcode: "", fontType: "E", size: 3, autoCut: false })
 
         print_arr.push({ value: "" + stringEndToAddSpace(getLanguage(this, 'lang_gran_total') + "(" + curreny_prefix + ")", 35) + stringFrontToAddSpace(number_format(invoice_type1[0]['invoice_total']), ((10 - number_format(invoice_type1[0]['invoice_total']).length))) + "", bold: false, underline: false, logoBase64String: "", newLines: 1, align: "left", separator: "", barcode: "", qrcode: "", fontType: "A", size: 3, autoCut: false })
 
         if (invoice_type1[0]['invoice_payment_method'] != 'Multi') {
 
           print_arr.push({ value: stringEndToAddSpace("Cash(" + curreny_prefix + ")", 35) + stringFrontToAddSpace(number_format(invoice_type1[0]['invoice_total']), ((10 - number_format(invoice_type1[0]['invoice_total']).length))) + "", bold: false, underline: false, logoBase64String: "", newLines: 1, align: "left", separator: "", barcode: "", qrcode: "", fontType: "A", size: 3, autoCut: false })
 
         } else {
 
 
           var product_payment_pay = alasql('SELECT * FROM ? where invoice_number="' + inv_main_id + '"', [paymentTypes]);
 
 
           for (var q = 0; q < product_payment_pay.length; q++) {
 
             print_arr.push({ value: stringEndToAddSpace(product_payment_pay[q]['payment_type'] + "(" + curreny_prefix + ")", 35) + stringFrontToAddSpace(number_format(product_payment_pay[q]['payment_amount']), ((10 - number_format(product_payment_pay[q]['payment_amount']).length))) + "", bold: false, underline: false, logoBase64String: "", newLines: 1, align: "left", separator: "", barcode: "", qrcode: "", fontType: "A", size: 3, autoCut: false })
 
           }
         }
 
         print_arr.push({ value: "" + stringEndToAddSpace(getLanguage(this, 'lang_balance') + "(" + curreny_prefix + ")", 35) + stringFrontToAddSpace(number_format(invoice_type1[0]['invoice_customer_balance']), ((10 - number_format(invoice_type1[0]['invoice_customer_balance']).length))) + "", bold: false, underline: false, logoBase64String: "", newLines: 1, align: "left", separator: "", barcode: "", qrcode: "", fontType: "A", size: 3, autoCut: false })
 
 
         print_arr.push({ value: '', bold: true, underline: true, newLines: 0, align: "center", separator: "-", logoBase64String: "", barcode: "", qrcode: "", fontType: "E", size: 3, autoCut: false })
 
         // print_arr.push({value: "", bold: false, underline: false, newLines: 0, align: "center", separator: "", logoBase64String: "", barcode: " ", qrcode: "", fontType: "A", size: 2, autoCut: false})
 
         if (customer_signature == 1) {
 
           print_arr.push({ value: "", bold: false, underline: false, newLines: 4, align: "left", separator: "", logoBase64String: "", barcode: "", qrcode: "", fontType: "A", size: 1, autoCut: false })
 
           print_arr.push({ value: "Customer Signature", bold: false, underline: false, newLines: 1, align: "left", separator: "", logoBase64String: "", barcode: "", qrcode: "", fontType: "A", size: 1, autoCut: false })
 
           print_arr.push({ value: '', bold: true, underline: true, newLines: 0, align: "center", separator: "-", logoBase64String: "", barcode: "", qrcode: "", fontType: "A", size: 3, autoCut: false })
         }
         print_arr.push({ value: "" + profile_notes + "", bold: false, underline: false, newLines: 2, align: "center", separator: "", logoBase64String: "", barcode: "", qrcode: "", fontType: "A", size: 1, autoCut: false })
 
 
       //   wscp.send(JSON.stringify({
       //     printerName: printer_name,//"POS80(2)",
       //     topLogoBase64String: imageBase64,
       //     autoCut: true,
       //     content: print_arr
       //   }));
       //   console.log('PRINT_invoice');
       // }
     }
 
   }
 
 }
 */
  var print_arr = [
    { value: "English  : mother", bold: true, underline: true, newLines: 1, align: "left", logoBase64String: "", barcode: "", qrcode: "", separator: "", fontType: "A", size: 1, autoCut: false },
    { value: "Ithalian : madre", bold: true, underline: true, newLines: 1, align: "left", logoBase64String: "", barcode: "", qrcode: "", separator: "", fontType: "A", size: 1, autoCut: false },
    { value: "Arabe    : أم", bold: true, underline: false, newLines: 1, align: "left", logoBase64String: "", barcode: "", qrcode: "", separator: "", fontType: "A", size: 1, autoCut: false },
    { value: "Russian  : мать", bold: true, underline: false, newLines: 1, align: "left", logoBase64String: "", barcode: "", qrcode: "", separator: "", fontType: "A", size: 1, autoCut: false },];
  wscp.send(JSON.stringify({
    printerName: "POS80(2)",//printer_name,//"POS80(2)",
    topLogoBase64String: '',//imageBase64,
    autoCut: true,
    content: print_arr
  }));
  console.log('CHECK_PRINTER_STATUS(printtype) => AUTO_INVOICE_PRINT(wscp) => ws://127.0.0.1:7890/POSMSGES : printed');
}



function AUTO_SHIFT_REPORT(wscp) {

  var shift_id = sessionStorage.getItem('shift_day_end_id');
  var r = indexedDB.open(db_name);
  var print_arr = [];
  var printer_name = '';
  var printer_status = '';
  var paper_size = '';
  var locationnames = '';
  var usernames = '';
  var businessnames = '';
  r.onsuccess = function (event) {

    var db = event.target.result;

    var request = db.transaction(['system_common_user_details'], 'readwrite')
      .objectStore('system_common_user_details');

    request.openCursor().onsuccess = function (event) {

      var cursor = event.target.result;
      if (cursor) {

        locationnames = cursor.value.terminal_name;
        usernames = sessionStorage.getItem('user_name');
        businessnames = cursor.value.business_name;
        cursor.continue();
      }
    }



    var objectStore_printer = db.transaction(['printer_settings'], 'readwrite')
      .objectStore('printer_settings');


    objectStore_printer.openCursor().onsuccess = function (event) {

      var cursor = event.target.result;
      if (cursor) {

        printer_name = cursor.value.printer_name

        paper_size = cursor.value.paper_size

        cursor.continue();
      }
    }


    print_arr.push({ value: 'Shift Status Report', bold: false, underline: false, newLines: 3, align: "center", logoBase64String: "", barcode: "", qrcode: "", separator: "", fontType: "A", size: 1, autoCut: false })
    print_arr.push({ value: '', bold: true, underline: true, newLines: 0, align: "center", separator: "-", logoBase64String: "", barcode: "", qrcode: "", fontType: "A", size: 1, autoCut: false })

    print_arr.push({ value: 'Shop name         :' + business_names + '', bold: false, underline: false, newLines: 1, align: "left", logoBase64String: "", barcode: "", qrcode: "", separator: "", fontType: "A", size: 1, autoCut: false })
    print_arr.push({ value: 'Terminal name     :' + location_names + '', bold: false, underline: false, newLines: 1, align: "left", logoBase64String: "", barcode: "", qrcode: "", separator: "", fontType: "A", size: 1, autoCut: false })

    var objectStoreInvoicePayment = db.transaction(['shift_day_end_reports'], 'readwrite')
      .objectStore('shift_day_end_reports').openCursor();


    objectStoreInvoicePayment.onsuccess = function (event) {

      var cursor = event.target.result;
      if (cursor) {

        if (cursor.value.shift_id == shift_id) {

          console.log('shift_day_end_id');
          print_arr.push({ value: 'Shift opened by   :' + stringEndToAddSpace(user_names, 7) + stringFrontToAddSpace('' + cursor.value.end_time + '', 2), bold: false, underline: false, newLines: 1, align: "left", logoBase64String: "", barcode: "", qrcode: "", separator: "", fontType: "A", size: 1, autoCut: false })
          print_arr.push({ value: '', bold: true, underline: true, newLines: 2, align: "center", separator: "-", logoBase64String: "", barcode: "", qrcode: "", fontType: "A", size: 1, autoCut: false })

          print_arr.push({ value: 'Cash drawer', bold: false, underline: false, newLines: 1, align: "center", logoBase64String: "", barcode: "", qrcode: "", separator: "", fontType: "A", size: 1, autoCut: false })

          print_arr.push({ value: '' + stringEndToAddSpace('Starting cash', 35) + stringFrontToAddSpace(number_format(cursor.value.report['Starting Cash']), ((13 - number_format(cursor.value.report['Starting Cash']).length))) + "", bold: false, underline: false, newLines: 1, align: "left", logoBase64String: "", barcode: "", qrcode: "", separator: "", fontType: "A", size: 1, autoCut: false })
          print_arr.push({ value: '' + stringEndToAddSpace('Cash sale', 35) + stringFrontToAddSpace(number_format(cursor.value.report['Net Sales']), ((13 - number_format(cursor.value.report['Net Sales']).length))) + "", bold: false, underline: false, newLines: 1, align: "left", logoBase64String: "", barcode: "", qrcode: "", separator: "", fontType: "A", size: 1, autoCut: false })

          print_arr.push({ value: '' + stringEndToAddSpace('Advance payment', 35) + stringFrontToAddSpace(number_format(cursor.value.report['Advance Payment']), ((13 - number_format(cursor.value.report['Advance Payment']).length))) + "", bold: false, underline: false, newLines: 1, align: "left", logoBase64String: "", barcode: "", qrcode: "", separator: "", fontType: "A", size: 1, autoCut: false })
          print_arr.push({ value: '' + stringEndToAddSpace('Cash credit settlements', 35) + stringFrontToAddSpace(number_format(cursor.value.report['Cash credit settlement']), ((13 - number_format(cursor.value.report['Cash credit settlement']).length))) + "", bold: false, underline: false, newLines: 1, align: "left", logoBase64String: "", barcode: "", qrcode: "", separator: "", fontType: "A", size: 1, autoCut: false })
          print_arr.push({ value: '' + stringEndToAddSpace('Cash refund', 35) + stringFrontToAddSpace(number_format(cursor.value.report['Refund']), ((13 - number_format(cursor.value.report['Refund']).length))) + "", bold: false, underline: false, newLines: 1, align: "left", logoBase64String: "", barcode: "", qrcode: "", separator: "", fontType: "A", size: 1, autoCut: false })
          print_arr.push({ value: '' + stringEndToAddSpace('Paid In', 35) + stringFrontToAddSpace(number_format(cursor.value.report['Paid In']), ((13 - number_format(cursor.value.report['Paid In']).length))) + "", bold: false, underline: false, newLines: 1, align: "left", logoBase64String: "", barcode: "", qrcode: "", separator: "", fontType: "A", size: 1, autoCut: false })
          print_arr.push({ value: '' + stringEndToAddSpace('Paid Out', 35) + stringFrontToAddSpace(number_format(cursor.value.report['Paid Out']), ((13 - number_format(cursor.value.report['Paid Out']).length))) + "", bold: false, underline: false, newLines: 1, align: "left", logoBase64String: "", barcode: "", qrcode: "", separator: "", fontType: "A", size: 1, autoCut: false })
          print_arr.push({ value: '' + stringEndToAddSpace('Expected cash amount', 35) + stringFrontToAddSpace(number_format(cursor.value.report['Expected Cash Amount In Drawer']), ((13 - number_format(cursor.value.report['Expected Cash Amount In Drawer']).length))) + "", bold: false, underline: false, newLines: 1, align: "left", logoBase64String: "", barcode: "", qrcode: "", separator: "", fontType: "A", size: 1, autoCut: false })


          print_arr.push({ value: '', bold: true, underline: true, newLines: 1, align: "center", separator: "-", logoBase64String: "", barcode: "", qrcode: "", fontType: "A", size: 1, autoCut: false })

          print_arr.push({ value: 'Daily sales summary', bold: false, underline: false, newLines: 1, align: "center", logoBase64String: "", barcode: "", qrcode: "", separator: "", fontType: "A", size: 1, autoCut: false })

          print_arr.push({ value: '' + stringEndToAddSpace('Gross sales', 35) + stringFrontToAddSpace(number_format(cursor.value.report['Gross Sale']), ((13 - number_format(cursor.value.report['Gross Sale']).length))) + "", bold: false, underline: false, newLines: 1, align: "left", logoBase64String: "", barcode: "", qrcode: "", separator: "", fontType: "A", size: 1, autoCut: false })
          print_arr.push({ value: '' + stringEndToAddSpace('Refunds', 35) + stringFrontToAddSpace(number_format(cursor.value.report['Refund']), ((13 - number_format(cursor.value.report['Refund']).length))) + "", bold: false, underline: false, newLines: 1, align: "left", logoBase64String: "", barcode: "", qrcode: "", separator: "", fontType: "A", size: 1, autoCut: false })
          print_arr.push({ value: '' + stringEndToAddSpace('Discounts', 35) + stringFrontToAddSpace(number_format(cursor.value.report['Discount']), ((13 - number_format(cursor.value.report['Discount']).length))) + "", bold: false, underline: false, newLines: 1, align: "left", logoBase64String: "", barcode: "", qrcode: "", separator: "", fontType: "A", size: 1, autoCut: false })

          print_arr.push({ value: '' + stringEndToAddSpace('Net sales', 35) + stringFrontToAddSpace(number_format(cursor.value.report['Net Sales']), ((13 - number_format(cursor.value.report['Net Sales']).length))) + "", bold: false, underline: false, newLines: 1, align: "left", logoBase64String: "", barcode: "", qrcode: "", separator: "", fontType: "A", size: 1, autoCut: false })

          print_arr.push({ value: '' + stringEndToAddSpace('Taxes', 35) + stringFrontToAddSpace(number_format(cursor.value.report['Taxes']), ((13 - number_format(cursor.value.report['Taxes']).length))) + "", bold: false, underline: false, newLines: 1, align: "left", logoBase64String: "", barcode: "", qrcode: "", separator: "", fontType: "A", size: 1, autoCut: false })

          print_arr.push({ value: '' + stringEndToAddSpace('Total tendered', 35) + stringFrontToAddSpace(number_format(cursor.value.report['Total Tendered']), ((13 - number_format(cursor.value.report['Total Tendered']).length))) + "", bold: false, underline: false, newLines: 1, align: "left", logoBase64String: "", barcode: "", qrcode: "", separator: "", fontType: "A", size: 1, autoCut: false })

          print_arr.push({ value: '', bold: true, underline: true, newLines: 1, align: "center", separator: "-", logoBase64String: "", barcode: "", qrcode: "", fontType: "A", size: 1, autoCut: false })

          print_arr.push({ value: 'Payment type wise sale', bold: false, underline: false, newLines: 1, align: "center", logoBase64String: "", barcode: "", qrcode: "", separator: "", fontType: "A", size: 1, autoCut: false })


          for (c = 0; c < cursor.value.report['paymentwise_sales'].length; c++) {

            var payment = cursor.value.report['paymentwise_sales'][c];
            payment = JSON.stringify(payment);
            payment = payment.split(':');
            var regex = /[{""}]/g;


            print_arr.push({ value: '' + stringEndToAddSpace(payment[0].replace(regex, " ").trim(), 35) + stringFrontToAddSpace(number_format(payment[1].replace(/}/g, "")), ((13 - number_format(payment[1].replace(/}/g, "")).length))) + "", bold: false, underline: false, newLines: 1, align: "left", logoBase64String: "", barcode: "", qrcode: "", separator: "", fontType: "A", size: 1, autoCut: false })


            if (c == (cursor.value.report['paymentwise_sales'].length - 1)) {
              print_arr.push({ value: '', bold: true, underline: true, newLines: 2, align: "left", separator: "-", logoBase64String: "", barcode: "", qrcode: "", fontType: "A", size: 1, autoCut: false })
            }
          }

        }

        cursor.continue();
      } else {

        wscp.send(JSON.stringify({
          printerName: printer_name,//"POS80(2)",
          topLogoBase64String: '',
          autoCut: true,
          content: print_arr
        }));
        sessionStorage.setItem('shift_day_end_id', '');
        console.log('PRINT_SHIFT_REPORT');

      }
    }

  }
}

//PRINT_SHIFT_REPORT();

function DEFAULT_PRINT_SHIFT_REPORT() {

  var shift_id = sessionStorage.getItem('shift_day_end_id');
  var r = indexedDB.open(db_name);

  var shift_end_report = '';
  r.onsuccess = function (event) {

    var db = event.target.result;

    var request = db.transaction(['system_common_user_details'], 'readwrite')
      .objectStore('system_common_user_details');

    request.openCursor().onsuccess = function (event) {

      var cursor = event.target.result;
      if (cursor) {


        sessionStorage.setItem('terminal_name', cursor.value.terminal_name);
        sessionStorage.setItem('pr_business_name', cursor.value.business_name)

        cursor.continue();
      } else {


        var objectStoreInvoicePayment = db.transaction(['shift_day_end_reports'], 'readwrite')
          .objectStore('shift_day_end_reports').openCursor();


        objectStoreInvoicePayment.onsuccess = function (event) {

          var cursor = event.target.result;
          if (cursor) {

            if (cursor.value.shift_id == shift_id) {
              shift_end_report = '<div class="" id="sh_end_reports">' +
                '<div class="box1">' +
                '<div class="box2" style="display: inline-block;">Shift Status Report</div>' +
                '</div>' +
                '<div class="box3">' +
                '<div class="box5">Shop name : ' + sessionStorage.getItem('pr_business_name') + '</div>' +
                '</div>' +
                '<div class="box3">' +
                '<div class="box5">Terminal name : ' + sessionStorage.getItem('terminal_name') + '</div>' +
                '</div>' +
                '<div class="box4">' +
                '<div class="box5">Shift opened by : ' + sessionStorage.getItem('user_name') + '</div>' +
                '<div class="box6">' + cursor.value.end_time + '</div>' +
                '</div>' +
                '<div class="box1"><div class="box2" style="display: inline-block;">Cash drawer</div></div>' +

                '<div class="box4">' +
                '<div class="box5">Starting cash    </div>' +
                '<div class="box6">' + number_format(cursor.value.report['Starting Cash']) + '</div>' +
                '</div>' +
                '<div class="box4">' +
                '<div class="box5">Cash sale    </div>' +
                '<div class="box6">' + number_format(cursor.value.report['Net Sales']) + '</div>' +
                '</div>' +
                '<div class="box4">' +
                '<div class="box5">Advance payment    </div>' +
                '<div class="box6">' + number_format(cursor.value.report['Advance Payment']) + '</div>' +
                '</div>' +
                '<div class="box4">' +
                '<div class="box5">Cash credit settlements    :</div>' +
                '<div class="box6">' + number_format(cursor.value.report['Cash credit settlement']) + '</div>' +
                '</div>' +
                '<div class="box4">' +
                '<div class="box5">Cash refund    </div>' +
                '<div class="box6">' + number_format(cursor.value.report['Paid In']) + '</div>' +
                '</div>' +
                '<div class="box4">' +
                '<div class="box5">Paid Out   </div>' +
                '<div class="box6">' + number_format(cursor.value.report['Paid Out']) + '</div>' +
                '</div>' +
                '<div class="box4">' +
                '<div class="box5">Expected cash amount    :</div>' +
                '<div class="box6">' + number_format(cursor.value.report['Expected Cash Amount In Drawer']) + '</div>' +
                '</div>' +
                '<div class="box4">' +
                '<div class="box5">Gross sales  </div>' +
                '<div class="box6">' + number_format(cursor.value.report['Gross Sale']) + '</div>' +
                '</div>' +
                '<div class="box4">' +
                '<div class="box5">Refunds</div>' +
                '<div class="box6">' + number_format(cursor.value.report['Refund']) + '</div>' +
                '</div>' +
                '<div class="box4">' +
                '<div class="box5">Discounts</div>' +
                '<div class="box6">' + number_format(cursor.value.report['Discount']) + '</div>' +
                '</div>' +
                '<div class="box4">' +
                '<div class="box5">Net sales</div>' +
                '<div class="box6">' + number_format(cursor.value.report['Net Sales']) + '</div>' +
                '</div>' +
                '<div class="box4">' +
                '<div class="box5">Taxes</div>' +
                '<div class="box6">' + number_format(cursor.value.report['Taxes']) + '</div>' +
                '</div>' +
                '<div class="box4">' +
                '<div class="box5">Total tendered</div>' +
                '<div class="box6">' + number_format(cursor.value.report['Total Tendered']) + '</div>' +
                '</div>' +
                '<div class="box1"><div class="box2" style="display: inline-block;">Payment type wise sale</div></div>';






              for (c = 0; c < cursor.value.report['paymentwise_sales'].length; c++) {

                var payment = cursor.value.report['paymentwise_sales'][c];
                payment = JSON.stringify(payment);
                payment = payment.split(':');
                var regex = /[{""}]/g;

                shift_end_report += '<div class="box4">' +
                  '<div class="box5">' + payment[0].replace(regex, " ").trim() + '</div>' +
                  '<div class="box6">' + number_format(payment[1].replace(/}/g, "")) + '</div>' +
                  '</div></div>';



                if (c == (cursor.value.report['paymentwise_sales'].length - 1)) {
                  $('#sh_end_report').empty().append(shift_end_report);
                  sessionStorage.setItem('shift_day_end_id', '');
                  var divToPrint = document.getElementById('sh_end_report');

                  var newWin = window.open('', 'Print-Window');

                  newWin.document.open();

                  newWin.document.write('<html><style>.box1{text-align: center;font-size: 15px;} .box2{display: inline-block;} .box3{text-align: left;font-size: 14px;padding: 5px 15px;} .box4{display: flex;font-size: 15px;padding: 5px 15px;} .box5{width:50%;} .box6{width:50%;text-align: right;}</style><body onload="printA()">' + divToPrint.innerHTML + '</body></html>');


                  newWin.document.write(

                    "<script type='text/javascript'>" +

                    "function printA(){" +
                    " window.print();" +
                    " }" +

                    "(function() {" +
                    "var beforePrint = function(event) {" +
                    "   console.log('Functionality to run before printing.');" +
                    "};" +
                    "var afterPrint = function() {" +

                    //"  console.log(id);"+

                    "window.close();" +

                    "};" +

                    "if (window.matchMedia) {" +
                    "   var mediaQueryList = window.matchMedia('print');" +
                    "   mediaQueryList.addListener(function(mql) {" +
                    "       if (mql.matches) {" +
                    "           beforePrint();" +
                    "       } else {" +
                    "           afterPrint();" +

                    "       }" +
                    "   });" +
                    "}" +

                    "window.onbeforeprint = beforePrint;" +
                    "window.onafterprint = afterPrint;" +
                    "}());" +
                    "<\/script>");
                  newWin.document.close();
                }

              }

            }

            cursor.continue();
          }
        }


      }
    }
  }

}

//PRINT_SHIFT_REPORT();

//after charge button click
function CHECK_PRINTER_STATUS(printtype) {
  var wscp;
  if ("WebSocket" in window) {
    // init the websocket client ws://localhost:6690/add
    wscp = new WebSocket("ws://127.0.0.1:7890/POSMSGES");
    wscp.onopen = function () {
      console.log("CHECK_PRINTER_STATUS(printtype) => ws://127.0.0.1:7890/POSMSGES : connected");
      AUTO_INVOICE_PRINT(wscp)
      /* 
      wscp.send(JSON.stringify({ name: "get printers" }));
 
      if (printtype == 'shift_print') {
         AUTO_SHIFT_REPORT(wscp);
       } else {
         AUTO_INVOICE_PRINT(wscp)
       }
      */

    };
    wscp.onclose = function () {
      console.log("CHECK_PRINTER_STATUS(printtype) => ws://127.0.0.1:7890/POSMSGES : closed");
      $.confirm({
        boxWidth: '30%',
        useBootstrap: false,
        Class: 'box',
        title: 'Print error!',
        content: 'An error occurred while printing. check printer connection',
        buttons: {
          OK: {
            text: "OK",
            action: function () {
              if (printtype == 'shift_print') {
                DEFAULT_PRINT_SHIFT_REPORT();
                sessionStorage.setItem('shift_day_end_id', '');
              }
            } // text for button
          },

        }
      });
    };
    wscp.onmessage = function (e) { };
  }
}


/** THIS METHOD USE FOR THE EXECUTE CHARGE BTN */
$(document).on('click', "#btnCharge", () => {
  CHECK_PRINTER_STATUS("printerType");
});


 //after charge button click

 // 1.CHECK_PRINTER_STATUS(printtype)
// 

