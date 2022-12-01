function CHECK_PRINTER_STATUS(printtype, data) {
  var wscp;
  if ("WebSocket" in window) {
    // init the websocket client ws://localhost:6690/add
    wscp = new WebSocket("ws://127.0.0.1:7890/POSMSGES");
    wscp.onopen = function () {
      // console.log("/PRINTERS : connected");
      sessionStorage.setItem("print_times", 0);

      //  wscp.send(JSON.stringify({ name: "get printers" }));
     
      if (printtype == "shift_print") {
        AUTO_SHIFT_REPORT(wscp);
      } else if (printtype == "credit_note_print") {
        AUTO_REFUND_AND_CREDITNOTE_PRINT(wscp);
      } else if (printtype == "customer_report") {
        CUSTOM_SHIFT_REPORT(wscp, data);
      } else if (printtype == "hold_bill") {
        AUTO_HOLD_BILL_PRINT(wscp, data);
      } else if (printtype == "kot_print") {
        PRINT_KOT(wscp);
      } else {

        setTimeout(function() {
           AUTO_INVOICE_PRINT(wscp);
        }, 1500);
      }
    };

    wscp.onclose = function () {
      // console.log("/PRINTERS : closed 1");

      if (
        $(".jconfirm-open").length == 0 &&
        printer_connection_status == 1 &&
        sessionStorage.getItem("print_times") == 0
      ) {
        sessionStorage.setItem("print_times", "");
        printer_connection_status = 0;
        $(".jconfirm").remove();
        $.confirm({
          boxWidth: "30%",
          useBootstrap: false,
          Class: "box",
          title: "Error!",
          content: "Printer is disconnected",
          buttons: {
            OK: {
              text: "OK",
            },
          },
        });
      } else if (
        $(".jconfirm-open").length == 0 &&
        printer_connection_status == 1 &&
        sessionStorage.getItem("print_times") == 1
      ) {
        sessionStorage.setItem("print_times", 0);
        $(".jconfirm").remove();
        $.confirm({
          boxWidth: "30%",
          useBootstrap: false,
          Class: "box",
          title: "Error!",
          content: "Printer is disconnected",
          buttons: {
            OK: {
              text: "OK",
              action: function () {
                if (printtype == "shift_print") {
                  DEFAULT_PRINT_SHIFT_REPORT();
                  // sessionStorage.setItem('shift_day_end_id','');
                }
              }, // text for button
            },
          },
        });
      } else if (
        $(".jconfirm-open").length == 0 &&
        printer_connection_status == 0 &&
        sessionStorage.getItem("print_times") == 1
      ) {
        $(".jconfirm").remove();
        $("._refresh").click();
        sessionStorage.setItem("print_times", 0);
      } else {
        $(".jconfirm").remove();
      }
    };

    wscp.onmessage = function (e) {};
  }
}
function stringEndToAddSpace(n, l) {
  var space = "\x20";
  var nm = "";
  nm = n;

  for (var x = 0; x < l - n.length; x++) {
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

$(document).on("click", "#setting_printer", function () {
  //$("#printersetup").show();
  $(
    "#home_screen_layout,#item_cart_layout,#Language_layout,#Screenlock_layout"
  ).hide();
  LOAD_PRINTER_DETAILS();
});

$(document).on("click", "._refresh", function () {
  var wscp;

  if ("WebSocket" in window) {
    // init the websocket client ws://localhost:6690/add
    wscp = new WebSocket("ws://127.0.0.1:7890/PRINTERS");

    console.log(wscp);
    wscp.onopen = function () {
      printer_connection_status = 0;
      $("#select_printer").empty();

      wscp.send(JSON.stringify({ name: "get printers" }));
    };
    wscp.onclose = function () {
      printer_connection_status = 1;
      $(".jconfirm").remove();
      if ($(".jconfirm-open").length == 0) {
        $.confirm({
          boxWidth: "30%",
          useBootstrap: false,
          Class: "box",
          title: "Error!",
          content: "Printer is disconnected",
          buttons: {
            OK: {
              text: "OK",
            },
          },
        });
      }
    };
    wscp.onmessage = function (e) {
      // console.log("/PRINTERS :", e.data);
      //echop("/PRINTERS :", e.data);
      //Append to select dropdown
      var option = document.createElement("option");
      option.text = e.data;
      option.value = e.data;
      var select = document.getElementById("select_printer");
      select.appendChild(option);

      $(
        "#select_printer,#print_paper_size,#setting_printer_status input,#btn_printer_layout"
      ).prop("disabled", false);
      //$("#setting_printer_status input").prop("checked", true);
      // LOAD_PRINTER_DETAILS();
    };
  }
});

// invoice print
function AUTO_INVOICE_PRINT(wscp) {
  var r = indexedDB.open(db_name);
  r.onsuccess = function (event) {
    var db = event.target.result;
    var printer_name = "";
    var paper_size = "";
    var profile_data = [];
    var customer_data = []; //print_invoice_id
    var inv_main_id = sessionStorage.getItem("print_invoice_id");
    var invoice_type1 = [];
    var invoice_type2 = [];
    var invoice_type3 = [];
    var invoice_type4 = []; //WEB_POS_currency_prefix
    var profile_notes = "";
    var drawerstatus = 0;
    var printerType = 1; ///receipt=1; kot=2;
    var drawer = false;
    var cashier = sessionStorage.getItem("user_name");
    var print_type = sessionStorage.getItem("print_type");
    var curreny_prefix = sessionStorage.getItem("WEB_POS_currency_prefix");
    if (cashier == "") {
      cashier = "admin";
    }
    var imageBase64 = "";

    var tax_code = [];
    var tax_value = [];
    var tax_itemcode = [];
    var tax_percentage = [];
    var tax_type = [];
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
    var qr_code = 0;
    var qr_value = "";
    var qr_type = 0;
    var receipt_view_url = "";
    var arr_product = [];
    var invoice_receipt_comment = 0;
    var tax_codeall = [];
    var pro_code = [];
    var pro_codeall = [];
    var pro_codeI = [];
    var pro_codeallI = [];
    if (db.objectStoreNames.contains("products") && get_product == 0) {
      var data_products = db
        .transaction(["products"], "readwrite")
        .objectStore("products");

      data_products.openCursor().onsuccess = function (event) {
        var cursor = event.target.result;

        if (cursor) {
          var productData = cursor.value;

          arr_product.push(productData);

          cursor.continue();
        } else {
          get_product = arr_product;
        }
      };
    }

    var objectStore_printer = db
      .transaction(["printer_settings"], "readwrite")
      .objectStore("printer_settings");

    objectStore_printer.openCursor().onsuccess = function (event) {
      var cursor = event.target.result;
      if (cursor) {

        if(cursor.value.printer_type==1 && cursor.value.printer_status==1){
        printer_name = cursor.value.printer_name;

        paper_size = cursor.value.paper_size;
        printerType = cursor.value.printer_type;
        drawerstatus = cursor.value.drawer_status;
        }

        cursor.continue();
      } else {
        if (drawerstatus == 1) {
          drawer = true;
        }

        //console.log('AUTO_INVOICE_PRINT'+ printer_name);
      }
    };

    var paymentTypes = [];
    var objectStoreInvoicePayment = db
      .transaction(["invoice_payment"], "readwrite")
      .objectStore("invoice_payment")
      .openCursor();

    objectStoreInvoicePayment.onsuccess = function (event) {
      var cursor = event.target.result;
      if (cursor) {
        paymentTypes.push(cursor.value);

        cursor.continue();
      }
    };

    var objectsystem_profile_common_data = db
      .transaction(["system_profile_common_data"], "readwrite")
      .objectStore("system_profile_common_data")
      .openCursor();

    objectsystem_profile_common_data.onsuccess = function (event) {
      var cursor = event.target.result;
      if (cursor) {
        if (cursor.value.code == 1) {
          invoiceItemValue = cursor.value.value;
        }

        if (cursor.value.code == 2) {
          invoiceItemCode = cursor.value.value;
        }

        cursor.continue();
      }
    };

    var print_arr = [];

    // print_arr.push({
    //    value: '', bold: true, underline: true, newLines: 0, align: "center", separator: "-", logoBase64String: "", barcode: "", qrcode: "", fontType: "E"
    //   , size: 1, autoCut: false
    // })
    var objectStore_printer = db
      .transaction(["system_profile"], "readwrite")
      .objectStore("system_profile");

    objectStore_printer.openCursor().onsuccess = function (event) {
      var cursor = event.target.result;
      if (cursor) {
        profile_data.push(cursor.value);
        profile_notes = cursor.value.profile_notes;
        imageBase64 = cursor.value.invoice_logo;
        line_num = cursor.value.invItemNo;
        customer_signature = cursor.value.customer_signature;
        qr_code = cursor.value.qr_enable;
        qr_value = cursor.value.qr_data_value;
        qr_type = cursor.value.qr_data_type;
        invoice_receipt_comment = cursor.value.receipt_comment;
        cursor.continue();
      } else {
        // console.log(profile_data[0]['profile_address']);
        var profile_address_lines = profile_data[0]["profile_address"];
        var alllength = profile_data[0]["profile_address"].split("\n");
        profile_address_lines.trim();

        if (profile_data[0]["profile_address"] != "") {
          for (r = 0; r < alllength.length; r++) {
            print_arr.push({
              value: alllength[r].trim(),
              bold: false,
              underline: false,
              newLines: 1,
              align: "center",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              separator: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });
          }
        }

        if (profile_data[0]["profile_phone"] != "") {
          print_arr.push({
            value: profile_data[0]["profile_phone"],
            bold: false,
            underline: false,
            newLines: 0,
            align: "center",
            separator: "",
            logoBase64String: "",
            barcode: "",
            qrcode: "",
            fontType: "A",
            size: 1,
            autoCut: false,
          });
        }

        
      }
    };

    var printer_customer = db
      .transaction(["customer"], "readwrite")
      .objectStore("customer");

    printer_customer.openCursor().onsuccess = function (event) {
      var cursor = event.target.result;
      if (cursor) {
        customer_data.push(cursor.value);
        cursor.continue();
      }
    };

    var objectStore = db
      .transaction(["invoice_tax"], "readwrite")
      .objectStore("invoice_tax");

    objectStore.openCursor().onsuccess = function (event) {
      var cursor = event.target.result;

      if (cursor) {
        if (cursor.value.invoice_main_number == inv_main_id) {
          tax_code.push(cursor.value.tax_code);
          tax_value.push(cursor.value.item_tax);
          tax_itemcode.push(cursor.value.invoice_itemcode);
          tax_percentage.push(cursor.value.tax_percentage);
          tax_type.push(cursor.value.tax_type);
          tax_line_no.push(cursor.value.invoice_line_no);
          tax_codeall.push(cursor.value);
        }

        cursor.continue();
      } else {

      //  console.log('inv_main_id'+inv_main_id);
        var print_invoice = db
          .transaction(["invoice"], "readwrite")
          .objectStore("invoice");

        print_invoice.openCursor().onsuccess = function (event) {
          var cursor = event.target.result;
          if (cursor) {
            if (cursor.value.invoice_main_number == inv_main_id) {
              if (cursor.value.invoice_itemtype_number == 1) {
                invoice_type1.push(cursor.value);
              }
              if (cursor.value.invoice_itemtype_number == 2) {
                invoice_type2.push(cursor.value);
              }
              if (cursor.value.invoice_itemtype_number == 3) {
                invoice_type3.push(cursor.value);
              }
              if (cursor.value.invoice_itemtype_number == 4) {
                invoice_type4.push(cursor.value);
              }
            }

            cursor.continue();
          } else {

            print_arr.push({
                value: "",
                bold: true,
                underline: true,
                newLines: 0,
                align: "center",
                separator: "-",
                logoBase64String: "",
                barcode: "",
                qrcode: "",
                fontType: "A",
                size: 3,
                autoCut: false,
            });

           
            if(invoice_type1[0]["kot_number"]!=''){
                var kot_num='';
               if ($(".billing").hasClass("view_bck_image")) {
                  kot_num=invoice_type1[0]["kot_number"];

               }else{
                  kot_num=invoice_type1[0]["kot_number"];
               }
            print_arr.push({
                value:
                  "" +
                  stringEndToAddSpace("Ref# ", 6) +
                  ":" +
                 kot_num ,
                bold: false,
                underline: false,
                newLines: 0,
                align: "center",
                separator: "",
                logoBase64String: "",
                barcode: "",
                qrcode: "",
                fontType: "A",
                size: 2,
                autoCut: false,
              });
            }

            //console.log(invoice_type1);
            print_arr.push({
                value: "",
                bold: true,
                underline: true,
                newLines: 0,
                align: "center",
                separator: "-",
                logoBase64String: "",
                barcode: "",
                qrcode: "",
                fontType: "A",
                size: 3,
                autoCut: false,
            });


            if (print_type == "duplicate") {
              drawer = false;
              print_arr.push({
                value:
                  "" +
                  stringEndToAddSpace("Receipt #", 12) +
                  ":" +
                  inv_main_id +
                  "(Duplicate)",
                bold: false,
                underline: false,
                newLines: 0,
                align: "left",
                separator: "",
                logoBase64String: "",
                barcode: "",
                qrcode: "",
                fontType: "A",
                size: 1,
                autoCut: false,
              });
            } else {
              print_arr.push({
                value:
                  "" +
                  stringEndToAddSpace("Receipt #", 12) +
                  ":" +
                  inv_main_id +
                  "",
                bold: false,
                underline: false,
                newLines: 0,
                align: "left",
                separator: "",
                logoBase64String: "",
                barcode: "",
                qrcode: "",
                fontType: "A",
                size: 1,
                autoCut: false,
              });
            }

            
            //  print_arr.push({ value: ''+stringEndToAddSpace(getLanguage(this,'lang_receipt'), 12)+':'+invoice_type1[0]['invoice_main_number']+('(Duplicate)'), bold: false, underline: false, newLines: 0, align: "left", separator: "", logoBase64String: "", barcode: "", qrcode: "", fontType: "A", size: 1, autoCut: false})
            print_arr.push({
              value:
                "" + stringEndToAddSpace("Cashier", 12) + ":" + cashier + "",
              bold: false,
              underline: false,
              newLines: 0,
              align: "left",
              separator: "",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });

            if (invoice_type1[0]["invoice_customer_id"] != "COM1") {
              for (i = 0; i < customer_data.length; i++) {
                if (
                  customer_data[i].customer_id ==
                  invoice_type1[0]["invoice_customer_id"]
                ) {
                  print_arr.push({
                    value:
                      "" +
                      stringEndToAddSpace("Customer", 12) +
                      ":" +
                      customer_data[i].customer_name +
                      " " +
                      customer_data[i].customer_last_name +
                      "",
                    bold: false,
                    underline: false,
                    newLines: 0,
                    align: "left",
                    separator: "",
                    logoBase64String: "",
                    barcode: "",
                    qrcode: "",
                    fontType: "A",
                    size: 1,
                    autoCut: false,
                  });
                }
              }
            }
            // print_arr.push({value:''+stringEndToAddSpace(getLanguage(this,'lang_date'),12)+':'+invoice_type1[0]['invoice_date_time']+'', bold: true, underline: false, newLines: 0, align: "left", separator: "", logoBase64String: "", barcode: "", qrcode: "", fontType: "E", size: 3, autoCut: false})
            if (
              invoice_type1[0]["order_type"] != null &&
              invoice_type1[0]["order_type"] != "" &&
              invoice_type1[0]["order_type"] != undefined &&
              invoice_type1[0]["order_type"] != "N/A" &&
              invoice_type1[0]["order_type"] != "undefined"
            ) {
              print_arr.push({
                value:
                  "" +
                  stringEndToAddSpace("Order type", 12) +
                  ":" +
                  invoice_type1[0]["order_type"] +
                  "",
                bold: false,
                underline: false,
                newLines: 0,
                align: "left",
                separator: "",
                logoBase64String: "",
                barcode: "",
                qrcode: "",
                fontType: "A",
                size: 1,
                autoCut: false,
              });
            }
            print_arr.push({
              value:
                "" +
                stringEndToAddSpace("Date", 12) +
                ":" +
                invoice_type1[0]["invoice_date_time"] +
                "",
              bold: false,
              underline: false,
              newLines: 0,
              align: "left",
              separator: "",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });

            print_arr.push({
              value: "",
              bold: false,
              underline: false,
              newLines: 0,
              align: "center",
              separator: "-",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });

            print_arr.push({
              value:
                "" +
                stringEndToAddSpace("Item price",) +
                stringEndToAddSpace("Qty", 4) +
                stringFrontToAddSpace("Total", 12) +
                "(" +
                curreny_prefix +
                ")",
              bold: false,
              underline: false,
              newLines: 0,
              align: "left",
              separator: "-",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });

            // console.log('invoice_type1.length----'+invoice_type1.length);
            for (var i = 0; i < invoice_type1.length; i++) {
              // invoiceItemCode=0;
              // invoiceItemValue=0;
              var discount =
                invoice_type1[i]["invoice_reference_value"].split("/");
              var product_name = alasql(
                'SELECT product_name FROM ? where product_code="' +
                  invoice_type1[i]["invoice_itemcode"] +
                  '" AND product_status ="1"',
                [get_product]
              );
              // console.log(get_product);
              // console.log(product_name);
              var line_number = "";
              var num = 19;
              var line_space = 0;
              var invoice_item_value = "";
              var invoice_item_code = "";
              var productItemcode = invoice_type1[i]["invoice_itemcode"];

              if (line_num == 1) {
                line_number = i + 1 + ".";
                line_space = 2;
              }
              if (invoiceItemCode == 1) {
                invoice_item_code = productItemcode;
              }
              if (invoiceItemValue == 1) {
                if (invoice_item_code != "") {
                  invoice_item_code = invoice_item_code + "-";
                }
                invoice_item_value = product_name[0]["product_name"];
              }

              var product_remark = invoice_type1[i]["item_remark"];
              var inv_comment = invoice_type1[0]["invoice_note"];
              var productitem_name =
                line_number + invoice_item_code + invoice_item_value;

              var productitem_qty = stringEndToAddSpace(
                invoice_type1[i]["invoice_qty"],
                4
              );
              // var productitem_total_price=stringFrontToAddSpace(number_format(invoice_type1[i]['invoice_price'] * invoice_type1[i]['invoice_qty']), 14);
              var tPrice = number_format(
                invoice_type1[i]["invoice_price"] *
                  invoice_type1[i]["invoice_qty"]
              );
              var productitem_total_price =
                stringFrontToAddSpace("", 12) +
                stringFrontToAddSpace(tPrice, 10 - tPrice.length);

              print_arr.push({
                value: "" + productitem_name + "",
                bold: false,
                underline: false,
                logoBase64String: "",
                newLines: 1,
                align: "left",
                separator: "",
                barcode: "",
                qrcode: "",
                fontType: "A",
                size: 1,
                autoCut: false,
              });

              print_arr.push({
                value:
                  "" +
                  stringEndToAddSpace(
                    stringFrontToAddSpace(
                      number_format(invoice_type1[i]["invoice_price"]),
                      line_space
                    ),
                    19
                  ) +
                  stringEndToAddSpace(
                    number_format(invoice_type1[i]["invoice_qty"]),
                    8
                  ) +
                  stringFrontToAddSpace(tPrice, 8) +
                  "",
                bold: false,
                underline: false,
                logoBase64String: "",
                newLines: 1,
                align: "left",
                separator: "",
                barcode: "",
                qrcode: "",
                fontType: "A",
                size: 1,
                autoCut: false,
              });

              print_arr.push({
                value: "",
                bold: false,
                underline: false,
                logoBase64String: "",
                newLines: 1,
                align: "left",
                separator: "",
                barcode: "",
                qrcode: "",
                fontType: "A",
                size: 1,
                autoCut: false,
              });

              if (
                invoice_type1[i]["invoice_discount"] > 0 &&
                invoice_type1[i]["invoice_discount"] != undefined &&
                invoice_type1[i]["invoice_discount"] != null
              ) {
                var vl_type = "%";
                if (invoice_type1[i]["invoice_value_type"] != "Percentage") {
                  vl_type = "";
                }
                print_arr.push({
                  value: stringFrontToAddSpace(
                    "-" +
                      "Discount" +
                      "(" +
                      (number_format(discount[1]) + "" + vl_type + "") +
                      "):" +
                      number_format(invoice_type1[i]["invoice_discount"]) +
                      "",
                    line_space
                  ),
                  bold: false,
                  underline: false,
                  logoBase64String: "",
                  newLines: 1,
                  align: "left",
                  separator: "",
                  barcode: "",
                  qrcode: "",
                  fontType: "A",
                  size: 1,
                  autoCut: false,
                });
              }

              subtotal =
                subtotal +
                parseFloat(invoice_type1[i]["invoice_price"]) *
                  invoice_type1[i]["invoice_qty"];
              total_line_discount =
                total_line_discount +
                parseFloat(invoice_type1[i]["invoice_discount"]);
              var taxCode = 0;
              var taxValue = 0;
              var taxPer = 0;
              var totalIncluded = 0;

              if (tax_itemcode.length > 0) {
                for (var x = 0; x < tax_itemcode.length; x++) {
                  if (invoice_type1[i]["invoice_line_no"] == tax_line_no[x]) {
                    taxCode = tax_code[x];
                    taxValue = tax_value[x];
                    taxPer = tax_percentage[x];

                    if (tax_type[x] == 1) {
                      if (pro_code.indexOf("" + taxCode + "") == -1) {
                        pro_code.push(taxCode);
                        var val =
                          taxCode + "_" + taxValue + "_" + taxPer + "_Excluded";
                        pro_codeall.push(val);
                      }

                      tax_exclude_price =
                        tax_exclude_price + parseFloat(taxValue);

                      // print_arr.push({
                      //   value: stringFrontToAddSpace(
                      //     "+" +
                      //       taxCode +
                      //       "(" +
                      //       taxPer +
                      //       "%):(" +
                      //       number_format(taxValue) +
                      //       ")",
                      //     line_space
                      //   ),
                      //   bold: false,
                      //   underline: false,
                      //   logoBase64String: "",
                      //   newLines: 1,
                      //   align: "left",
                      //   separator: "",
                      //   barcode: "",
                      //   qrcode: "",
                      //   fontType: "A",
                      //   size: 1,
                      //   autoCut: false,
                      // });
                    } else {
                      if (pro_codeI.indexOf("" + taxCode + "") == -1) {
                        pro_codeI.push(taxCode);
                        var val =
                          taxCode + "_" + taxValue + "_" + taxPer + "_included";
                        pro_codeallI.push(val);
                      }
                      tax_include_price =
                        tax_include_price + parseFloat(taxValue);
                      // print_arr.push({
                      //   value: stringFrontToAddSpace(
                      //     "+" +
                      //       taxCode +
                      //       "(" +
                      //       taxPer +
                      //       "%):(" +
                      //       number_format(taxValue) +
                      //       "-" +
                      //       getLanguage(this, "lang_include") +
                      //       ")",
                      //     line_space
                      //   ),
                      //   bold: false,
                      //   underline: false,
                      //   logoBase64String: "",
                      //   newLines: 1,
                      //   align: "left",
                      //   separator: "",
                      //   barcode: "",
                      //   qrcode: "",
                      //   fontType: "A",
                      //   size: 1,
                      //   autoCut: false,
                      // });
                    }
                  }
                }
              }
            }

            print_arr.push({
              value: "",
              bold: false,
              underline: false,
              logoBase64String: "",
              newLines: 2,
              align: "left",
              separator: "",
              barcode: "",
              qrcode: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });

            if (product_remark != "") {
              print_arr.push({
                value: stringFrontToAddSpace(product_remark, line_space),
                bold: false,
                underline: false,
                logoBase64String: "",
                newLines: 1,
                align: "left",
                separator: "",
                barcode: "",
                qrcode: "",
                fontType: "A",
                size: 1,
                autoCut: false,
              });
            }

            print_arr.push({
              value: "",
              bold: false,
              underline: false,
              logoBase64String: "",
              newLines: 1,
              align: "left",
              separator: "",
              barcode: "",
              qrcode: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });

            print_arr.push({
              value: "------------------------",
              bold: false,
              underline: false,
              logoBase64String: "",
              newLines: 1,
              align: "left",
              separator: "",
              barcode: "",
              qrcode: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });

            print_arr.push({
              value:
                "" +
                stringEndToAddSpace(
                  "Subtotal" + "(" + curreny_prefix + ")",
                  35
                ) +
                stringFrontToAddSpace(
                  number_format(subtotal),
                  10 - number_format(subtotal).length
                ) +
                "",
              bold: false,
              underline: false,
              logoBase64String: "",
              newLines: 1,
              align: "left",
              separator: "",
              barcode: "",
              qrcode: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });
            if (total_line_discount > 0) {
              print_arr.push({
                value:
                  "" +
                  stringEndToAddSpace(
                    "Total line discount" + "(" + curreny_prefix + ")",
                    35
                  ) +
                  stringFrontToAddSpace(
                    number_format(total_line_discount),
                    10 - number_format(total_line_discount).length
                  ) +
                  "",
                bold: false,
                underline: false,
                logoBase64String: "",
                newLines: 1,
                align: "left",
                separator: "",
                barcode: "",
                qrcode: "",
                fontType: "A",
                size: 1,
                autoCut: false,
              });
            }
            for (y = 0; y < invoice_type4.length; y++) {
              print_arr.push({
                value:
                  stringEndToAddSpace(
                    invoice_type4[y]["invoice_itemcode"] +
                      "(" +
                      invoice_type4[y]["invoice_reference_value"] +
                      "%)" +
                      "(" +
                      curreny_prefix +
                      ")",
                    35
                  ) +
                  stringFrontToAddSpace(
                    number_format(invoice_type4[y]["invoice_price"]),
                    10 - number_format(invoice_type4[y]["invoice_price"]).length
                  ) +
                  "",
                bold: false,
                underline: false,
                logoBase64String: "",
                newLines: 1,
                align: "left",
                separator: "",
                barcode: "",
                qrcode: "",
                fontType: "A",
                size: 1,
                autoCut: false,
              });
            }
            for (z = 0; z < invoice_type2.length; z++) {
              var inv_type = "%";
              if (invoice_type2[z]["invoice_value_type"] != "Percentage") {
                inv_type = "";
              }
              if (invoice_type2[z]["invoice_tax_mode"] == "Include") {
                print_arr.push({
                  value:
                    stringEndToAddSpace(
                      invoice_type2[z]["invoice_itemcode"] +
                        "-" +
                        invoice_type2[z]["invoice_tax_mode"] +
                        "(" +
                        invoice_type2[z]["invoice_reference_value"] +
                        inv_type +
                        ")" +
                        "(" +
                        curreny_prefix +
                        ")",
                      35
                    ) +
                    stringFrontToAddSpace(
                      number_format(invoice_type2[z]["invoice_price"]),
                      10 -
                        number_format(invoice_type2[z]["invoice_price"]).length
                    ) +
                    "",
                  bold: false,
                  underline: false,
                  logoBase64String: "",
                  newLines: 1,
                  align: "left",
                  separator: "",
                  barcode: "",
                  qrcode: "",
                  fontType: "A",
                  size: 1,
                  autoCut: false,
                });
              } else {
                print_arr.push({
                  value:
                    stringEndToAddSpace(
                      invoice_type2[z]["invoice_itemcode"] +
                        "(" +
                        invoice_type2[z]["invoice_reference_value"] +
                        inv_type +
                        ")" +
                        "(" +
                        curreny_prefix +
                        ")",
                      35
                    ) +
                    stringFrontToAddSpace(
                      number_format(invoice_type2[z]["invoice_price"]),
                      10 -
                        number_format(invoice_type2[z]["invoice_price"]).length
                    ) +
                    "",
                  bold: false,
                  underline: false,
                  logoBase64String: "",
                  newLines: 1,
                  align: "left",
                  separator: "",
                  barcode: "",
                  qrcode: "",
                  fontType: "A",
                  size: 1,
                  autoCut: false,
                });
              }
            }

            if (tax_exclude_price > 0) {
              //      for(var j=0; j< pro_code.length; j++){

              for (var x = 0; x < pro_codeall.length; x++) {
                var dsx = pro_codeall[x].split("_");
                //if (pro_code.indexOf("" + dsx[0] + "") !== -1) {
                var tot = 0;
                for (var j = 0; j < tax_codeall.length; j++) {
                  if (dsx[0] == tax_codeall[j].tax_code) {
                    tot += parseFloat(tax_codeall[j].item_tax);
                  }
                }

                print_arr.push({
                  value:
                    stringEndToAddSpace(
                      dsx[0] + "(" + dsx[2] + "%)(" + curreny_prefix + ")" + "",
                      35
                    ) +
                    stringFrontToAddSpace(
                      number_format(tot),
                      10 - number_format(tot).length
                    ) +
                    "",
                  bold: false,
                  underline: false,
                  logoBase64String: "",
                  newLines: 1,
                  align: "left",
                  separator: "",
                  barcode: "",
                  qrcode: "",
                  fontType: "A",
                  size: 1,
                  autoCut: false,
                });
              }
              // }
            }
            if (invoice_type3[0]["invoice_price"] > 0) {
              print_arr.push({
                value:
                  "" +
                  stringEndToAddSpace(
                    "Total discount" +
                      "(" +
                      invoice_type3[0]["invoice_reference_value"] +
                      "%)" +
                      "(" +
                      curreny_prefix +
                      ")",
                    35
                  ) +
                  stringFrontToAddSpace(
                    number_format(invoice_type3[0]["invoice_price"]),
                    10 - number_format(invoice_type3[0]["invoice_price"]).length
                  ) +
                  "",
                bold: false,
                underline: false,
                logoBase64String: "",
                newLines: 1,
                align: "left",
                separator: "",
                barcode: "",
                qrcode: "",
                fontType: "A",
                size: 1,
                autoCut: false,
              });
            }
            print_arr.push({
              value: "",
              bold: false,
              underline: false,
              logoBase64String: "",
              newLines: 1,
              align: "left",
              separator: "-",
              barcode: "",
              qrcode: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });

            print_arr.push({
              value:
                "" +
                stringEndToAddSpace(
                  "Grand Total" + "(" + curreny_prefix + ")",
                  35
                ) +
                stringFrontToAddSpace(
                  number_format(invoice_type1[0]["invoice_total"]),
                  10 - number_format(invoice_type1[0]["invoice_total"]).length
                ) +
                "",
              bold: false,
              underline: false,
              logoBase64String: "",
              newLines: 1,
              align: "left",
              separator: "",
              barcode: "",
              qrcode: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });

            if (tax_include_price > 0) {
              for (var x = 0; x < pro_codeallI.length; x++) {
                var dsx = pro_codeallI[x].split("_");
                //if (pro_code.indexOf("" + dsx[0] + "") !== -1) {
                var tot = 0;
                for (var j = 0; j < tax_codeall.length; j++) {
                  if (dsx[0] == tax_codeall[j].tax_code) {
                    tot += parseFloat(tax_codeall[j].item_tax);
                  }
                }

                print_arr.push({
                  value: stringFrontToAddSpace(
                    dsx[0] +
                      "-Included" +
                      "(" +
                      dsx[2] +
                      "%)(" +
                      curreny_prefix +
                      ")" +
                      number_format(tot) +
                      "",
                    line_space
                  ),
                  bold: false,
                  underline: false,
                  logoBase64String: "",
                  newLines: 1,
                  align: "left",
                  separator: "",
                  barcode: "",
                  qrcode: "",
                  fontType: "A",
                  size: 1,
                  autoCut: false,
                });
              }
            }

            // print_arr.push({
            //   value: "",
            //   bold: true,
            //   underline: false,
            //   newLines: 0,
            //   align: "center",
            //   separator: "-",
            //   logoBase64String: "",
            //   barcode: "",
            //   qrcode: "",
            //   fontType: "E",
            //   size: 3,
            //   autoCut: false,
            // });

            if (invoice_type1[0]["invoice_payment_method"] != "Multi") {
              print_arr.push({
                value:
                  stringEndToAddSpace(
                    "" +
                      invoice_type1[0]["invoice_payment_method"] +
                      "(" +
                      curreny_prefix +
                      ")",
                    35
                  ) +
                  stringFrontToAddSpace(
                    number_format(invoice_type1[0]["invoice_total"]),
                    10 - number_format(invoice_type1[0]["invoice_total"]).length
                  ) +
                  "",
                bold: false,
                underline: false,
                logoBase64String: "",
                newLines: 1,
                align: "left",
                separator: "",
                barcode: "",
                qrcode: "",
                fontType: "A",
                size: 1,
                autoCut: false,
              });
            } else {
              var product_payment_pay = alasql(
                'SELECT * FROM ? where invoice_number="' + inv_main_id + '"',
                [paymentTypes]
              );

              for (var q = 0; q < product_payment_pay.length; q++) {
                print_arr.push({
                  value:
                    stringEndToAddSpace(
                      product_payment_pay[q]["payment_type"] +
                        "(" +
                        curreny_prefix +
                        ")",
                      35
                    ) +
                    stringFrontToAddSpace(
                      number_format(product_payment_pay[q]["payment_amount"]),
                      10 -
                        number_format(product_payment_pay[q]["payment_amount"])
                          .length
                    ) +
                    "",
                  bold: false,
                  underline: false,
                  logoBase64String: "",
                  newLines: 1,
                  align: "left",
                  separator: "",
                  barcode: "",
                  qrcode: "",
                  fontType: "A",
                  size: 1,
                  autoCut: false,
                });
              }
            }

            print_arr.push({
              value:
                "" +
                stringEndToAddSpace(
                  "Balance" + "(" + curreny_prefix + ")",
                  35
                ) +
                stringFrontToAddSpace(
                  number_format(invoice_type1[0]["invoice_customer_balance"]),
                  10 -
                    number_format(invoice_type1[0]["invoice_customer_balance"])
                      .length
                ) +
                "",
              bold: false,
              underline: false,
              logoBase64String: "",
              newLines: 1,
              align: "left",
              separator: "",
              barcode: "",
              qrcode: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });

            print_arr.push({
              value: "",
              bold: true,
              underline: true,
              newLines: 0,
              align: "center",
              separator: "-",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              fontType: "E",
              size: 1,
              autoCut: false,
            });

            // print_arr.push({value: "", bold: false, underline: false, newLines: 0, align: "center", separator: "", logoBase64String: "", barcode: " ", qrcode: "", fontType: "A", size: 2, autoCut: false})

            if (customer_signature == 1) {
              print_arr.push({
                value: "",
                bold: false,
                underline: false,
                newLines: 4,
                align: "left",
                separator: "",
                logoBase64String: "",
                barcode: "",
                qrcode: "",
                fontType: "A",
                size: 1,
                autoCut: false,
              });

              print_arr.push({
                value: "Customer Signature",
                bold: false,
                underline: false,
                newLines: 1,
                align: "left",
                separator: "",
                logoBase64String: "",
                barcode: "",
                qrcode: "",
                fontType: "A",
                size: 1,
                autoCut: false,
              });

              // if(invoice_receipt_comment!=1){
              print_arr.push({
                value: "",
                bold: true,
                underline: true,
                newLines: 0,
                align: "center",
                separator: "-",
                logoBase64String: "",
                barcode: "",
                qrcode: "",
                fontType: "A",
                size: 1,
                autoCut: false,
              });
              //  }
            }

            if (invoice_receipt_comment == 1) {
              // print_arr.push({value: "Comment", bold: false, underline: false, newLines: 1, align: "left", separator: "", logoBase64String: "", barcode: "", qrcode: "", fontType: "A", size: 1, autoCut: false })
              if (inv_comment != "") {
                print_arr.push({
                  value: "" + inv_comment + "",
                  bold: true,
                  underline: false,
                  newLines: 0,
                  align: "center",
                  separator: "-",
                  logoBase64String: "",
                  barcode: "",
                  qrcode: "",
                  fontType: "A",
                  size: 1,
                  autoCut: false,
                });
              }
            }
            // console.log('qr_code------'+qr_code);
            if (qr_code == 1) {
              if (qr_type == 2) {
                print_arr.push({
                  value: "",
                  bold: false,
                  underline: false,
                  newLines: 2,
                  align: "center",
                  separator: "",
                  logoBase64String: "",
                  barcode: "",
                  qrcode: "" + qr_value + "",
                  fontType: "A",
                  size: 2,
                  autoCut: false,
                });

                print_arr.push({
                  value: "" + profile_notes + "",
                  bold: false,
                  underline: false,
                  newLines: 2,
                  align: "center",
                  separator: "",
                  logoBase64String: "",
                  barcode: "",
                  qrcode: "",
                  fontType: "A",
                  size: 1,
                  autoCut: false,
                });
               // console.log(print_arr);
                wscp.send(
                  JSON.stringify({
                    printerName: printer_name, //"POS80(2)",
                    topLogoBase64String: imageBase64,
                    autoCut: true,
                    openDrawer: drawer,
                    content: print_arr,
                  })
                );

                $.notify("Printed successfully", {
                  class: "success",
                  id: "lang_print_success",
                });
                sessionStorage.setItem("print_invoice_id", "");
              } else {
                var qr_arr = [
                  {
                    terminal_key: sessionStorage.getItem("token_license_key"),
                    receipt_no: invoice_type1[0]["invoice_main_number"],
                    white_label_enable: "0",
                    white_label_partner_id: "",
                  },
                ];

                var gettoken = encodeURIComponent(JSON.stringify(qr_arr));

                var final_qrcode = receipt_view_url.replace("XXXXXX", gettoken);

                print_arr.push({
                  value: "",
                  bold: false,
                  underline: false,
                  newLines: 2,
                  align: "center",
                  separator: "",
                  logoBase64String: "",
                  barcode: "",
                  qrcode: "" + final_qrcode + "",
                  fontType: "A",
                  size: 2,
                  autoCut: false,
                });

                print_arr.push({
                  value: "" + profile_notes + "",
                  bold: false,
                  underline: false,
                  newLines: 2,
                  align: "center",
                  separator: "",
                  logoBase64String: "",
                  barcode: "",
                  qrcode: "",
                  fontType: "A",
                  size: 1,
                  autoCut: false,
                });
                //console.log(print_arr);
                wscp.send(
                  JSON.stringify({
                    printerName: printer_name, //"POS80(2)",
                    topLogoBase64String: imageBase64,
                    autoCut: true,
                    openDrawer: drawer,
                    content: print_arr,
                  })
                );
                $.notify("Printed successfully", {
                  class: "success",
                  id: "lang_print_success",
                });
                sessionStorage.setItem("print_invoice_id", "");
              }
            } else {

              //console.log(print_arr);
              wscp.send(
                JSON.stringify({
                  printerName: printer_name, //"POS80(2)",
                  topLogoBase64String: imageBase64,
                  autoCut: true,
                  openDrawer: drawer,
                  content: print_arr,
                })
              );
              $.notify("Printed successfully", {
                class: "success",
                id: "lang_print_success",
              });
              sessionStorage.setItem("print_invoice_id", "");
            }
          }

          sessionStorage.setItem("print_type", "");
        };
      }
    };
  };
}

// refund and credit note print
function AUTO_REFUND_AND_CREDITNOTE_PRINT(wscp) {
  var r = indexedDB.open(db_name);
  r.onsuccess = function (event) {
    var db = event.target.result;
    var printer_name = "";
    var drawerstatus = 0;
    var printerType = 1; ///receipt=1; kot=2;
    var drawer = false;
    var profile_data = [];

    var inv_main_id = sessionStorage.getItem("print_invoice_id");
    var invoice_type1 = [];
    var invoice_type2 = [];

    var cashier = sessionStorage.getItem("user_name");
    var curreny_prefix = sessionStorage.getItem("WEB_POS_currency_prefix");
    if (cashier == "") {
      cashier = "admin";
    }
    var imageBase64 = "";

    var line_num = 0;
    var invoiceItemCode = 0;
    var invoiceItemValue = 0;
    var print_type = sessionStorage.getItem("print_type");
    var receipt_view_url = "";
    var arr_product = [];
    if (db.objectStoreNames.contains("products") && get_product == 0) {
      var data_products = db
        .transaction(["products"], "readwrite")
        .objectStore("products");

      data_products.openCursor().onsuccess = function (event) {
        var cursor = event.target.result;

        if (cursor) {
          var productData = cursor.value;

          arr_product.push(productData);

          cursor.continue();
        } else {
          get_product = arr_product;
        }
      };
    }

    var objectStore_printer = db
      .transaction(["printer_settings"], "readwrite")
      .objectStore("printer_settings");

    objectStore_printer.openCursor().onsuccess = function (event) {
      var cursor = event.target.result;
      if (cursor) {

        if(cursor.value.printer_type==1 && cursor.value.printer_status==1){
        printer_name = cursor.value.printer_name;

        paper_size = cursor.value.paper_size;
        printerType = cursor.value.printer_type;
        drawerstatus = cursor.value.drawer_status;
        }
        cursor.continue();
      } else {
        if (drawerstatus == 1) {
          drawer = true;
        }
      }
    };

    var paymentTypes = [];
    var objectStoreInvoicePayment = db
      .transaction(["invoice_payment"], "readwrite")
      .objectStore("invoice_payment")
      .openCursor();

    objectStoreInvoicePayment.onsuccess = function (event) {
      var cursor = event.target.result;
      if (cursor) {
        paymentTypes.push(cursor.value);

        cursor.continue();
      }
    };

    var objectsystem_profile_common_data = db
      .transaction(["system_profile_common_data"], "readwrite")
      .objectStore("system_profile_common_data")
      .openCursor();

    objectsystem_profile_common_data.onsuccess = function (event) {
      var cursor = event.target.result;
      if (cursor) {
        if (cursor.value.code == 1) {
          invoiceItemValue = cursor.value.value;
        }

        if (cursor.value.code == 2) {
          invoiceItemCode = cursor.value.value;
        }

        cursor.continue();
      }
    };

    var print_arr = [];

    var objectStore_printer = db
      .transaction(["system_profile"], "readwrite")
      .objectStore("system_profile");

    objectStore_printer.openCursor().onsuccess = function (event) {
      var cursor = event.target.result;
      if (cursor) {
        profile_data.push(cursor.value);
        profile_notes = cursor.value.profile_notes;
        imageBase64 = cursor.value.invoice_logo;
        line_num = cursor.value.invItemNo;
        customer_signature = cursor.value.customer_signature;
        qr_code = cursor.value.qr_enable;
        qr_value = cursor.value.qr_data_value;
        qr_type = cursor.value.qr_data_type;
        cursor.continue();
      } else {
        // console.log(profile_data[0]['profile_address']);
        var profile_address_lines = profile_data[0]["profile_address"];
        var alllength = profile_data[0]["profile_address"].split("\n");
        profile_address_lines.trim();

        if (profile_data[0]["profile_address"] != "") {
          for (r = 0; r < alllength.length; r++) {
            print_arr.push({
              value: alllength[r].trim(),
              bold: false,
              underline: false,
              newLines: 1,
              align: "center",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              separator: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });
          }
        }

        if (profile_data[0]["profile_phone"] != "") {
          print_arr.push({
            value: profile_data[0]["profile_phone"],
            bold: false,
            underline: false,
            newLines: 0,
            align: "center",
            separator: "",
            logoBase64String: "",
            barcode: "",
            qrcode: "",
            fontType: "A",
            size: 1,
            autoCut: false,
          });
        }

        print_arr.push({
          value: "",
          bold: true,
          underline: true,
          newLines: 0,
          align: "center",
          separator: "-",
          logoBase64String: "",
          barcode: "",
          qrcode: "",
          fontType: "A",
          size: 3,
          autoCut: false,
        });
      }
    };

    var invoice = db
      .transaction(["invoice"], "readwrite")
      .objectStore("invoice");

    invoice.openCursor().onsuccess = function (event) {
      var cursor = event.target.result;
      if (cursor) {
        if (cursor.value.invoice_credit_note_id == inv_main_id) {
          invoice_type2.push(cursor.value);
        }

        cursor.continue();
      } else {
      }
    };

    var print_credit_note = db
      .transaction(["invoice_credit_note"], "readwrite")
      .objectStore("invoice_credit_note");

    print_credit_note.openCursor().onsuccess = function (event) {
      var cursor = event.target.result;
      if (cursor) {
        if (cursor.value.credit_note_number == inv_main_id) {
          invoice_type1.push(cursor.value);
        }

        cursor.continue();
      } else {
        var refund_type = invoice_type1[0]["credit_note_type"];

        var refund_title = "";
        var header_title = "";
        if (refund_type == "CR") {
          header_title = "Cash Refund";
          refund_title =
            "REFUND AMOUNT" +
            "(" +
            curreny_prefix +
            ") :" +
            invoice_type1[0]["credit_note_total"];
        } else {
          header_title = "Credit note";
          refund_title =
            "CRN AMOUNT" +
            "(" +
            curreny_prefix +
            ") :" +
            invoice_type1[0]["credit_note_total"];
        }

        print_arr.push({
          value: "" + header_title + "",
          bold: false,
          underline: false,
          newLines: 0,
          align: "center",
          separator: "-",
          logoBase64String: "",
          barcode: "",
          qrcode: "",
          fontType: "A",
          size: 1,
          autoCut: false,
        });
        if (print_type == "duplicate") {
          drawer = false;
          print_arr.push({
            value:
              "" +
              stringEndToAddSpace(
                invoice_type1[0]["credit_note_type"] + " #",
                12
              ) +
              ":" +
              invoice_type1[0]["credit_note_number"] +
              "(Duplicate)",
            bold: false,
            underline: false,
            newLines: 0,
            align: "left",
            separator: "",
            logoBase64String: "",
            barcode: "",
            qrcode: "",
            fontType: "A",
            size: 1,
            autoCut: false,
          });
        } else {
          if (header_title == "Credit note") {
            drawer = false;
          }
          print_arr.push({
            value:
              "" +
              stringEndToAddSpace(
                invoice_type1[0]["credit_note_type"] + " #",
                12
              ) +
              ":" +
              invoice_type1[0]["credit_note_number"] +
              "",
            bold: false,
            underline: false,
            newLines: 0,
            align: "left",
            separator: "",
            logoBase64String: "",
            barcode: "",
            qrcode: "",
            fontType: "A",
            size: 1,
            autoCut: false,
          });
        }

        print_arr.push({
          value:
            "" +
            stringEndToAddSpace("Receipt #", 12) +
            ":" +
            invoice_type1[0]["credit_note_invoice_number"] +
            "",
          bold: false,
          underline: false,
          newLines: 0,
          align: "left",
          separator: "",
          logoBase64String: "",
          barcode: "",
          qrcode: "",
          fontType: "A",
          size: 1,
          autoCut: false,
        });
        print_arr.push({
          value: "" + stringEndToAddSpace("Cashier", 12) + ":" + cashier + "",
          bold: false,
          underline: false,
          newLines: 0,
          align: "left",
          separator: "",
          logoBase64String: "",
          barcode: "",
          qrcode: "",
          fontType: "A",
          size: 1,
          autoCut: false,
        });

        print_arr.push({
          value:
            "" +
            stringEndToAddSpace("Date", 12) +
            ":" +
            invoice_type1[0]["credit_note_date"] +
            "",
          bold: false,
          underline: false,
          newLines: 0,
          align: "left",
          separator: "",
          logoBase64String: "",
          barcode: "",
          qrcode: "",
          fontType: "A",
          size: 1,
          autoCut: false,
        });

        print_arr.push({
          value: "",
          bold: false,
          underline: false,
          newLines: 0,
          align: "center",
          separator: "-",
          logoBase64String: "",
          barcode: "",
          qrcode: "",
          fontType: "A",
          size: 1,
          autoCut: false,
        });

        print_arr.push({
          value:
            "" +
            stringEndToAddSpace("Item", 23) +
            stringFrontToAddSpace("Qty", 12) +
            "(" +
            curreny_prefix +
            ")",
          bold: false,
          underline: false,
          newLines: 0,
          align: "left",
          separator: "-",
          logoBase64String: "",
          barcode: "",
          qrcode: "",
          fontType: "A",
          size: 1,
          autoCut: false,
        });

        for (var i = 0; i < invoice_type1.length; i++) {
          var product_name = alasql(
            'SELECT product_name FROM ? where product_code="' +
              invoice_type1[i]["credit_note_item_code"] +
              '" AND product_status ="1"',
            [get_product]
          );

          var line_number = "";
          var num = 19;
          var line_space = 0;
          var invoice_item_value = "";
          var invoice_item_code = "";
          var productItemcode = invoice_type1[i]["credit_note_item_code"];

          if (line_num == 1) {
            line_number = i + 1 + ".";
            line_space = 2;
          }
          if (invoiceItemCode == 1) {
            invoice_item_code = productItemcode;
          }
          if (invoiceItemValue == 1) {
            if (invoice_item_code != "") {
              invoice_item_code = invoice_item_code + "-";
            }
            invoice_item_value = product_name[0]["product_name"];
          }

          var productitem_name =
            line_number + invoice_item_code + invoice_item_value;

          print_arr.push({
            value:
              "" +
              stringEndToAddSpace(
                stringFrontToAddSpace(productitem_name, line_space),
                27
              ) +
              stringFrontToAddSpace(invoice_type1[i]["credit_note_qty"], 8) +
              "",
            bold: false,
            underline: false,
            logoBase64String: "",
            newLines: 1,
            align: "left",
            separator: "",
            barcode: "",
            qrcode: "",
            fontType: "A",
            size: 1,
            autoCut: false,
          });
        }

        print_arr.push({
          value: "",
          bold: false,
          underline: true,
          logoBase64String: "",
          newLines: 1,
          align: "left",
          separator: "-",
          barcode: "",
          qrcode: "",
          fontType: "A",
          size: 1,
          autoCut: false,
        });

        print_arr.push({
          value: "" + refund_title + "",
          bold: false,
          underline: false,
          newLines: 2,
          align: "center",
          separator: "",
          logoBase64String: "",
          barcode: "",
          qrcode: "",
          fontType: "A",
          size: 1,
          autoCut: false,
        });

        print_arr.push({
          value: "",
          bold: false,
          underline: false,
          newLines: 4,
          align: "center",
          separator: "",
          logoBase64String: "",
          barcode: "",
          qrcode: "" + qr_value + "",
          fontType: "A",
          size: 2,
          autoCut: false,
        });

        wscp.send(
          JSON.stringify({
            printerName: printer_name, //"POS80(2)",
            topLogoBase64String: imageBase64,
            autoCut: true,
            openDrawer: drawer,
            content: print_arr,
          })
        );

        $.notify("Printed successfully", {
          class: "success",
          id: "lang_print_success",
        });
        sessionStorage.setItem("print_invoice_id", "");
        sessionStorage.setItem("print_type", "");
      }
    };
  };
}

function AUTO_SHIFT_REPORT(wscp) {
  var shift_id = sessionStorage.getItem("shift_day_end_id");

  // console.log('shift_id'+shift_id);
  var r = indexedDB.open(db_name);
  var print_arr = [];
  var printer_name = "";
  var printer_status = "";
  var paper_size = "";
  var usernames = sessionStorage.getItem("user_name");
  var locationnames = sessionStorage.getItem("terminal_name");
  var businessnames = sessionStorage.getItem("location_name");
  var receipt_view_url = sessionStorage.getItem("pos_receipt_view_url");
  var shift_open_user = "";
  var drawerstatus = 0;
  var printerType = 1; ///receipt=1; kot=2;
  var drawer = false;
  r.onsuccess = function (event) {
    var db = event.target.result;

    var objectStore_shift = db
      .transaction(["shift_cash_transactions"], "readwrite")
      .objectStore("shift_cash_transactions");

    objectStore_shift.openCursor().onsuccess = function (event) {
      var cursor = event.target.result;
      if (cursor) {
        if (
          cursor.value.day_end_id == shift_id &&
          cursor.value.transaction_reason == "Open Balance"
        ) {
          shift_open_user = cursor.value.cashier_username;
        }

        cursor.continue();
      } else {
        // console.log(shift_open_user);
      }
    };

    var objectStore_printer = db
      .transaction(["printer_settings"], "readwrite")
      .objectStore("printer_settings");

    objectStore_printer.openCursor().onsuccess = function (event) {
      var cursor = event.target.result;
      if (cursor) {

        if(cursor.value.printer_type==1 && cursor.value.printer_status==1){
        printer_name = cursor.value.printer_name;

        paper_size = cursor.value.paper_size;
        printerType = cursor.value.printer_type;
        // drawerstatus= cursor.value.drawer_status;
        }
        cursor.continue();
      }
    };

    setTimeout(function () {
      // if(drawerstatus==1){
      //     drawer=true;
      // }
      //console.log('business_names'+sessionStorage.getItem('terminal_name'));
      // console.log('location_names'+sessionStorage.getItem('terminal_name'))
      var objectStoreInvoicePayment = db
        .transaction(["shift_day_end_reports"], "readwrite")
        .objectStore("shift_day_end_reports")
        .openCursor();

      objectStoreInvoicePayment.onsuccess = function (event) {
        var cursor = event.target.result;
        if (cursor) {
          if (cursor.value.shift_id == shift_id) {
            user_names = sessionStorage.getItem("user_name");

            if (user_names == "") {
              user_names = "admin";
            }
            print_arr.push({
              value: "Shift Status Report",
              bold: false,
              underline: false,
              newLines: 3,
              align: "center",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              separator: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });
            print_arr.push({
              value: "",
              bold: true,
              underline: true,
              newLines: 0,
              align: "center",
              separator: "-",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });

            print_arr.push({
              value:
                "Shop name         :" +
                sessionStorage.getItem("location_name") +
                "",
              bold: false,
              underline: false,
              newLines: 1,
              align: "left",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              separator: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });
            print_arr.push({
              value:
                "Terminal name     :" +
                sessionStorage.getItem("terminal_name") +
                "",
              bold: false,
              underline: false,
              newLines: 1,
              align: "left",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              separator: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });

            print_arr.push({
              value:
                "Shift opened by   :" + stringEndToAddSpace(shift_open_user, 7),
              bold: false,
              underline: false,
              newLines: 1,
              align: "left",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              separator: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });
            print_arr.push({
              value: stringFrontToAddSpace(
                "" + cursor.value.start_time + "",
                19
              ),
              bold: false,
              underline: false,
              newLines: 1,
              align: "left",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              separator: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });
            print_arr.push({
              value: "Shift closed by   :" + stringEndToAddSpace(user_names, 7),
              bold: false,
              underline: false,
              newLines: 1,
              align: "left",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              separator: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });
            print_arr.push({
              value: stringFrontToAddSpace("" + cursor.value.end_time + "", 19),
              bold: false,
              underline: false,
              newLines: 1,
              align: "left",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              separator: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });
            print_arr.push({
              value: "",
              bold: true,
              underline: true,
              newLines: 2,
              align: "center",
              separator: "-",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });

            print_arr.push({
              value: "Cash drawer",
              bold: false,
              underline: false,
              newLines: 1,
              align: "center",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              separator: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });

            print_arr.push({
              value:
                "" +
                stringEndToAddSpace("Starting cash", 35) +
                stringFrontToAddSpace(
                  number_format(cursor.value.report["Starting Cash"]),
                  13 -
                    number_format(cursor.value.report["Starting Cash"]).length
                ) +
                "",
              bold: false,
              underline: false,
              newLines: 1,
              align: "left",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              separator: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });
            print_arr.push({
              value:
                "" +
                stringEndToAddSpace("Cash sale", 35) +
                stringFrontToAddSpace(
                  number_format(cursor.value.report["Net Sales"]),
                  13 - number_format(cursor.value.report["Net Sales"]).length
                ) +
                "",
              bold: false,
              underline: false,
              newLines: 1,
              align: "left",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              separator: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });

            print_arr.push({
              value:
                "" +
                stringEndToAddSpace("Advance payment", 35) +
                stringFrontToAddSpace(
                  number_format(cursor.value.report["Advance Payment"]),
                  13 -
                    number_format(cursor.value.report["Advance Payment"]).length
                ) +
                "",
              bold: false,
              underline: false,
              newLines: 1,
              align: "left",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              separator: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });
            print_arr.push({
              value:
                "" +
                stringEndToAddSpace("Cash credit settlements", 35) +
                stringFrontToAddSpace(
                  number_format(cursor.value.report["Cash credit settlement"]),
                  13 -
                    number_format(cursor.value.report["Cash credit settlement"])
                      .length
                ) +
                "",
              bold: false,
              underline: false,
              newLines: 1,
              align: "left",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              separator: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });
            print_arr.push({
              value:
                "" +
                stringEndToAddSpace("Cash refund", 35) +
                stringFrontToAddSpace(
                  number_format(cursor.value.report["Refund"]),
                  13 - number_format(cursor.value.report["Refund"]).length
                ) +
                "",
              bold: false,
              underline: false,
              newLines: 1,
              align: "left",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              separator: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });
            print_arr.push({
              value:
                "" +
                stringEndToAddSpace("Paid In", 35) +
                stringFrontToAddSpace(
                  number_format(cursor.value.report["Paid In"]),
                  13 - number_format(cursor.value.report["Paid In"]).length
                ) +
                "",
              bold: false,
              underline: false,
              newLines: 1,
              align: "left",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              separator: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });
            print_arr.push({
              value:
                "" +
                stringEndToAddSpace("Paid Out", 35) +
                stringFrontToAddSpace(
                  number_format(cursor.value.report["Paid Out"]),
                  13 - number_format(cursor.value.report["Paid Out"]).length
                ) +
                "",
              bold: false,
              underline: false,
              newLines: 1,
              align: "left",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              separator: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });
            print_arr.push({
              value:
                "" +
                stringEndToAddSpace("Expected cash amount", 35) +
                stringFrontToAddSpace(
                  number_format(
                    cursor.value.report["Expected Cash Amount In Drawer"]
                  ),
                  13 -
                    number_format(
                      cursor.value.report["Expected Cash Amount In Drawer"]
                    ).length
                ) +
                "",
              bold: false,
              underline: false,
              newLines: 1,
              align: "left",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              separator: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });

            print_arr.push({
              value: "",
              bold: true,
              underline: true,
              newLines: 1,
              align: "center",
              separator: "-",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });

            print_arr.push({
              value: "Daily sales summary",
              bold: false,
              underline: false,
              newLines: 1,
              align: "center",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              separator: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });

            print_arr.push({
              value:
                "" +
                stringEndToAddSpace("Gross sales", 35) +
                stringFrontToAddSpace(
                  number_format(cursor.value.report["Gross Sale"]),
                  13 - number_format(cursor.value.report["Gross Sale"]).length
                ) +
                "",
              bold: false,
              underline: false,
              newLines: 1,
              align: "left",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              separator: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });
            print_arr.push({
              value:
                "" +
                stringEndToAddSpace("Refunds", 35) +
                stringFrontToAddSpace(
                  number_format(cursor.value.report["Refund"]),
                  13 - number_format(cursor.value.report["Refund"]).length
                ) +
                "",
              bold: false,
              underline: false,
              newLines: 1,
              align: "left",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              separator: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });
            print_arr.push({
              value:
                "" +
                stringEndToAddSpace("Discounts", 35) +
                stringFrontToAddSpace(
                  number_format(cursor.value.report["Discount"]),
                  13 - number_format(cursor.value.report["Discount"]).length
                ) +
                "",
              bold: false,
              underline: false,
              newLines: 1,
              align: "left",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              separator: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });

            print_arr.push({
              value:
                "" +
                stringEndToAddSpace("Net sales", 35) +
                stringFrontToAddSpace(
                  number_format(cursor.value.report["Net Sales"]),
                  13 - number_format(cursor.value.report["Net Sales"]).length
                ) +
                "",
              bold: false,
              underline: false,
              newLines: 1,
              align: "left",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              separator: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });

            print_arr.push({
              value:
                "" +
                stringEndToAddSpace("Taxes", 35) +
                stringFrontToAddSpace(
                  number_format(cursor.value.report["Taxes"]),
                  13 - number_format(cursor.value.report["Taxes"]).length
                ) +
                "",
              bold: false,
              underline: false,
              newLines: 1,
              align: "left",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              separator: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });

            print_arr.push({
              value:
                "" +
                stringEndToAddSpace("Total tendered", 35) +
                stringFrontToAddSpace(
                  number_format(cursor.value.report["Total Tendered"]),
                  13 -
                    number_format(cursor.value.report["Total Tendered"]).length
                ) +
                "",
              bold: false,
              underline: false,
              newLines: 1,
              align: "left",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              separator: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });

            print_arr.push({
              value: "",
              bold: true,
              underline: true,
              newLines: 1,
              align: "center",
              separator: "-",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });

            print_arr.push({
              value: "Payment type wise sale",
              bold: false,
              underline: false,
              newLines: 1,
              align: "center",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              separator: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });

            for (
              c = 0;
              c < cursor.value.report["paymentwise_sales"].length;
              c++
            ) {
              var payment = cursor.value.report["paymentwise_sales"][c];
              payment = JSON.stringify(payment);
              payment = payment.split(":");
              var regex = /[{""}]/g;

              print_arr.push({
                value:
                  "" +
                  stringEndToAddSpace(
                    payment[0].replace(regex, " ").trim(),
                    35
                  ) +
                  stringFrontToAddSpace(
                    number_format(payment[1].replace(/}/g, "")),
                    13 - number_format(payment[1].replace(/}/g, "")).length
                  ) +
                  "",
                bold: false,
                underline: false,
                newLines: 1,
                align: "left",
                logoBase64String: "",
                barcode: "",
                qrcode: "",
                separator: "",
                fontType: "A",
                size: 1,
                autoCut: false,
              });

              if (c == cursor.value.report["paymentwise_sales"].length - 1) {
                print_arr.push({
                  value: "",
                  bold: true,
                  underline: true,
                  newLines: 2,
                  align: "left",
                  separator: "-",
                  logoBase64String: "",
                  barcode: "",
                  qrcode: "",
                  fontType: "A",
                  size: 1,
                  autoCut: false,
                });
              }
            }
          }

          cursor.continue();
        } else {
          // console.log('printer_name'+printer_name);
          wscp.send(
            JSON.stringify({
              printerName: printer_name, //"POS80(2)",
              topLogoBase64String: "",
              autoCut: true,
              openDrawer: drawer,
              content: print_arr,
            })
          );
          sessionStorage.setItem("shift_day_end_id", "");
          $.notify("Printed successfully", {
            class: "success",
            id: "lang_print_success",
          });
          // console.log(print_arr);
        }
      };
    }, 2000);
  };
}

//PRINT_SHIFT_REPORT();

function DEFAULT_PRINT_SHIFT_REPORT() {
  var shift_id = sessionStorage.getItem("shift_day_end_id");
  var r = indexedDB.open(db_name);

  var shift_end_report = "";
  r.onsuccess = function (event) {
    var db = event.target.result;

    var request = db
      .transaction(["system_common_user_details"], "readwrite")
      .objectStore("system_common_user_details");

    request.openCursor().onsuccess = function (event) {
      var cursor = event.target.result;
      if (cursor) {
        sessionStorage.setItem("terminal_name", cursor.value.terminal_name);
        sessionStorage.setItem("pr_business_name", cursor.value.business_name);

        cursor.continue();
      } else {
        var objectStoreInvoicePayment = db
          .transaction(["shift_day_end_reports"], "readwrite")
          .objectStore("shift_day_end_reports")
          .openCursor();

        objectStoreInvoicePayment.onsuccess = function (event) {
          var cursor = event.target.result;
          if (cursor) {
            if (shift_id!="" && cursor.value.shift_id == shift_id) {
              shift_end_report =
                '<div class="" id="sh_end_reports">' +
                '<div class="box1">' +
                '<div class="box2" style="display: inline-block;">Shift Status Report</div>' +
                "</div>" +
                '<div class="box3">' +
                '<div class="box5">Shop name : ' +
                sessionStorage.getItem("pr_business_name") +
                "</div>" +
                "</div>" +
                '<div class="box3">' +
                '<div class="box5">Terminal name : ' +
                sessionStorage.getItem("terminal_name") +
                "</div>" +
                "</div>" +
                '<div class="box4">' +
                '<div class="box5">Shift opened by : ' +
                sessionStorage.getItem("user_name") +
                "</div>" +
                '<div class="box6">' +
                cursor.value.start_time +
                "</div>" +
                "</div>" +
                '<div class="box4">' +
                '<div class="box5">Shift closed by : ' +
                sessionStorage.getItem("user_name") +
                "</div>" +
                '<div class="box6">' +
                cursor.value.end_time +
                "</div>" +
                "</div>" +
                '<div class="box1"><div class="box2" style="display: inline-block;">Cash drawer</div></div>' +
                '<div class="box4">' +
                '<div class="box5">Starting cash    </div>' +
                '<div class="box6">' +
                number_format(cursor.value.report["Starting Cash"]) +
                "</div>" +
                "</div>" +
                '<div class="box4">' +
                '<div class="box5">Cash sale    </div>' +
                '<div class="box6">' +
                number_format(cursor.value.report["Net Sales"]) +
                "</div>" +
                "</div>" +
                '<div class="box4">' +
                '<div class="box5">Advance payment    </div>' +
                '<div class="box6">' +
                number_format(cursor.value.report["Advance Payment"]) +
                "</div>" +
                "</div>" +
                '<div class="box4">' +
                '<div class="box5">Cash credit settlements    :</div>' +
                '<div class="box6">' +
                number_format(cursor.value.report["Cash credit settlement"]) +
                "</div>" +
                "</div>" +
                '<div class="box4">' +
                '<div class="box5">Cash refund    </div>' +
                '<div class="box6">' +
                number_format(cursor.value.report["Paid In"]) +
                "</div>" +
                "</div>" +
                '<div class="box4">' +
                '<div class="box5">Paid Out   </div>' +
                '<div class="box6">' +
                number_format(cursor.value.report["Paid Out"]) +
                "</div>" +
                "</div>" +
                '<div class="box4">' +
                '<div class="box5">Expected cash amount    :</div>' +
                '<div class="box6">' +
                number_format(
                  cursor.value.report["Expected Cash Amount In Drawer"]
                ) +
                "</div>" +
                "</div>" +
                '<div class="box4">' +
                '<div class="box5">Gross sales  </div>' +
                '<div class="box6">' +
                number_format(cursor.value.report["Gross Sale"]) +
                "</div>" +
                "</div>" +
                '<div class="box4">' +
                '<div class="box5">Refunds</div>' +
                '<div class="box6">' +
                number_format(cursor.value.report["Refund"]) +
                "</div>" +
                "</div>" +
                '<div class="box4">' +
                '<div class="box5">Discounts</div>' +
                '<div class="box6">' +
                number_format(cursor.value.report["Discount"]) +
                "</div>" +
                "</div>" +
                '<div class="box4">' +
                '<div class="box5">Net sales</div>' +
                '<div class="box6">' +
                number_format(cursor.value.report["Net Sales"]) +
                "</div>" +
                "</div>" +
                '<div class="box4">' +
                '<div class="box5">Taxes</div>' +
                '<div class="box6">' +
                number_format(cursor.value.report["Taxes"]) +
                "</div>" +
                "</div>" +
                '<div class="box4">' +
                '<div class="box5">Total tendered</div>' +
                '<div class="box6">' +
                number_format(cursor.value.report["Total Tendered"]) +
                "</div>" +
                "</div>" +
                '<div class="box1"><div class="box2" style="display: inline-block;">Payment type wise sale</div></div>';

              for (
                c = 0;
                c < cursor.value.report["paymentwise_sales"].length;
                c++
              ) {
                var payment = cursor.value.report["paymentwise_sales"][c];
                payment = JSON.stringify(payment);
                payment = payment.split(":");
                var regex = /[{""}]/g;

                shift_end_report +=
                  '<div class="box4">' +
                  '<div class="box5">' +
                  payment[0].replace(regex, " ").trim() +
                  "</div>" +
                  '<div class="box6">' +
                  number_format(payment[1].replace(/}/g, "")) +
                  "</div>" +
                  "</div></div>";

                if (c == cursor.value.report["paymentwise_sales"].length - 1) {
                  $("#sh_end_report").empty().append(shift_end_report);
                  sessionStorage.setItem("shift_day_end_id", "");
                  var divToPrint = document.getElementById("sh_end_report");

                  var newWin = window.open("", "Print-Window");

                  newWin.document.open();

                  newWin.document.write(
                    '<html><style>.box1{text-align: center;font-size: 15px;} .box2{display: inline-block;} .box3{text-align: left;font-size: 14px;padding: 5px 15px;} .box4{display: flex;font-size: 15px;padding: 5px 15px;} .box5{width:50%;} .box6{width:50%;text-align: right;}</style><body onload="printA()">' +
                      divToPrint.innerHTML +
                      "</body></html>"
                  );

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
                      "</script>"
                  );
                  newWin.document.close();
                }
              }
            }

            cursor.continue();
          }
        };
      }
    };
  };
}

//PRINT_SHIFT_REPORT();

function CUSTOM_SHIFT_REPORT(wscp, data) {
  var paymentypesales = data.report.paymentwise_sales;
  var shift_id = sessionStorage.getItem("shift_day_end_id");
  var r = indexedDB.open(db_name);
  var print_arr = [];
  var printer_name = "";
  var printer_status = "";
  var paper_size = "";
  var drawer = false;
  var usernames = sessionStorage.getItem("user_name");
  var locationnames = sessionStorage.getItem("terminal_name");
  var businessnames = sessionStorage.getItem("location_name");
  var receipt_view_url = sessionStorage.getItem("pos_receipt_view_url");
  r.onsuccess = function (event) {
    var db = event.target.result;

    var objectStore_printer = db
      .transaction(["printer_settings"], "readwrite")
      .objectStore("printer_settings");

    objectStore_printer.openCursor().onsuccess = function (event) {
      var cursor = event.target.result;
      if (cursor) {

        if(cursor.value.printer_type==1 && cursor.value.printer_status==1){
        printer_name = cursor.value.printer_name;

        paper_size = cursor.value.paper_size;
          }
        cursor.continue();
      } else {
        print_arr.push({
          value: "Shift Status Report",
          bold: false,
          underline: false,
          newLines: 3,
          align: "center",
          logoBase64String: "",
          barcode: "",
          qrcode: "",
          separator: "",
          fontType: "A",
          size: 1,
          autoCut: false,
        });
        print_arr.push({
          value: "",
          bold: true,
          underline: true,
          newLines: 0,
          align: "center",
          separator: "-",
          logoBase64String: "",
          barcode: "",
          qrcode: "",
          fontType: "A",
          size: 1,
          autoCut: false,
        });

        print_arr.push({
          value: "Shop name         :" + business_names + "",
          bold: false,
          underline: false,
          newLines: 1,
          align: "left",
          logoBase64String: "",
          barcode: "",
          qrcode: "",
          separator: "",
          fontType: "A",
          size: 1,
          autoCut: false,
        });
        print_arr.push({
          value: "Terminal name     :" + location_names + "",
          bold: false,
          underline: false,
          newLines: 1,
          align: "left",
          logoBase64String: "",
          barcode: "",
          qrcode: "",
          separator: "",
          fontType: "A",
          size: 1,
          autoCut: false,
        });

        //console.log('shift_day_end_id');
        print_arr.push({
          value:
            "Shift opened by   :" +
            stringEndToAddSpace(user_names, 7) +
            stringFrontToAddSpace("" + data.end_time + "", 2),
          bold: false,
          underline: false,
          newLines: 1,
          align: "left",
          logoBase64String: "",
          barcode: "",
          qrcode: "",
          separator: "",
          fontType: "A",
          size: 1,
          autoCut: false,
        });
        print_arr.push({
          value: "",
          bold: true,
          underline: true,
          newLines: 2,
          align: "center",
          separator: "-",
          logoBase64String: "",
          barcode: "",
          qrcode: "",
          fontType: "A",
          size: 1,
          autoCut: false,
        });

        print_arr.push({
          value: "Cash drawer",
          bold: false,
          underline: false,
          newLines: 1,
          align: "center",
          logoBase64String: "",
          barcode: "",
          qrcode: "",
          separator: "",
          fontType: "A",
          size: 1,
          autoCut: false,
        });

        print_arr.push({
          value:
            "" +
            stringEndToAddSpace("Starting cash", 35) +
            stringFrontToAddSpace(
              number_format(data.report["Starting Cash"]),
              13 - number_format(data.report["Starting Cash"]).length
            ) +
            "",
          bold: false,
          underline: false,
          newLines: 1,
          align: "left",
          logoBase64String: "",
          barcode: "",
          qrcode: "",
          separator: "",
          fontType: "A",
          size: 1,
          autoCut: false,
        });
        print_arr.push({
          value:
            "" +
            stringEndToAddSpace("Cash sale", 35) +
            stringFrontToAddSpace(
              number_format(data.report["Cash Payment"]),
              13 - number_format(data.report["Net Sales"]).length
            ) +
            "",
          bold: false,
          underline: false,
          newLines: 1,
          align: "left",
          logoBase64String: "",
          barcode: "",
          qrcode: "",
          separator: "",
          fontType: "A",
          size: 1,
          autoCut: false,
        });

        print_arr.push({
          value:
            "" +
            stringEndToAddSpace("Advance payment", 35) +
            stringFrontToAddSpace(
              number_format(data.report["Advance Payment"]),
              13 - number_format(data.report["Advance Payment"]).length
            ) +
            "",
          bold: false,
          underline: false,
          newLines: 1,
          align: "left",
          logoBase64String: "",
          barcode: "",
          qrcode: "",
          separator: "",
          fontType: "A",
          size: 1,
          autoCut: false,
        });
        print_arr.push({
          value:
            "" +
            stringEndToAddSpace("Cash credit settlements", 35) +
            stringFrontToAddSpace(
              number_format(data.report["Cash credit settlement"]),
              13 - number_format(data.report["Cash credit settlement"]).length
            ) +
            "",
          bold: false,
          underline: false,
          newLines: 1,
          align: "left",
          logoBase64String: "",
          barcode: "",
          qrcode: "",
          separator: "",
          fontType: "A",
          size: 1,
          autoCut: false,
        });
        print_arr.push({
          value:
            "" +
            stringEndToAddSpace("Cash refund", 35) +
            stringFrontToAddSpace(
              number_format(data.report["Cash Refund"]),
              13 - number_format(data.report["Refund"]).length
            ) +
            "",
          bold: false,
          underline: false,
          newLines: 1,
          align: "left",
          logoBase64String: "",
          barcode: "",
          qrcode: "",
          separator: "",
          fontType: "A",
          size: 1,
          autoCut: false,
        });
        print_arr.push({
          value:
            "" +
            stringEndToAddSpace("Paid In", 35) +
            stringFrontToAddSpace(
              number_format(data.report["Paid In"]),
              13 - number_format(data.report["Paid In"]).length
            ) +
            "",
          bold: false,
          underline: false,
          newLines: 1,
          align: "left",
          logoBase64String: "",
          barcode: "",
          qrcode: "",
          separator: "",
          fontType: "A",
          size: 1,
          autoCut: false,
        });
        print_arr.push({
          value:
            "" +
            stringEndToAddSpace("Paid Out", 35) +
            stringFrontToAddSpace(
              number_format(data.report["Paid Out"]),
              13 - number_format(data.report["Paid Out"]).length
            ) +
            "",
          bold: false,
          underline: false,
          newLines: 1,
          align: "left",
          logoBase64String: "",
          barcode: "",
          qrcode: "",
          separator: "",
          fontType: "A",
          size: 1,
          autoCut: false,
        });
        print_arr.push({
          value:
            "" +
            stringEndToAddSpace("Expected cash amount", 35) +
            stringFrontToAddSpace(
              number_format(data.report["Expected Cash Amount In Drawer"]),
              13 -
                number_format(data.report["Expected Cash Amount In Drawer"])
                  .length
            ) +
            "",
          bold: false,
          underline: false,
          newLines: 1,
          align: "left",
          logoBase64String: "",
          barcode: "",
          qrcode: "",
          separator: "",
          fontType: "A",
          size: 1,
          autoCut: false,
        });

        print_arr.push({
          value: "",
          bold: true,
          underline: true,
          newLines: 1,
          align: "center",
          separator: "-",
          logoBase64String: "",
          barcode: "",
          qrcode: "",
          fontType: "A",
          size: 1,
          autoCut: false,
        });

        print_arr.push({
          value: "Daily sales summary",
          bold: false,
          underline: false,
          newLines: 1,
          align: "center",
          logoBase64String: "",
          barcode: "",
          qrcode: "",
          separator: "",
          fontType: "A",
          size: 1,
          autoCut: false,
        });

        print_arr.push({
          value:
            "" +
            stringEndToAddSpace("Gross sales", 35) +
            stringFrontToAddSpace(
              number_format(data.report["Gross Sale"]),
              13 - number_format(data.report["Gross Sale"]).length
            ) +
            "",
          bold: false,
          underline: false,
          newLines: 1,
          align: "left",
          logoBase64String: "",
          barcode: "",
          qrcode: "",
          separator: "",
          fontType: "A",
          size: 1,
          autoCut: false,
        });
        print_arr.push({
          value:
            "" +
            stringEndToAddSpace("Refunds", 35) +
            stringFrontToAddSpace(
              number_format(data.report["Cash Refund"]),
              13 - number_format(data.report["Refund"]).length
            ) +
            "",
          bold: false,
          underline: false,
          newLines: 1,
          align: "left",
          logoBase64String: "",
          barcode: "",
          qrcode: "",
          separator: "",
          fontType: "A",
          size: 1,
          autoCut: false,
        });
        print_arr.push({
          value:
            "" +
            stringEndToAddSpace("Discounts", 35) +
            stringFrontToAddSpace(
              number_format(data.report["Discount"]),
              13 - number_format(data.report["Discount"]).length
            ) +
            "",
          bold: false,
          underline: false,
          newLines: 1,
          align: "left",
          logoBase64String: "",
          barcode: "",
          qrcode: "",
          separator: "",
          fontType: "A",
          size: 1,
          autoCut: false,
        });

        print_arr.push({
          value:
            "" +
            stringEndToAddSpace("Net sales", 35) +
            stringFrontToAddSpace(
              number_format(data.report["Net Sales"]),
              13 - number_format(data.report["Net Sales"]).length
            ) +
            "",
          bold: false,
          underline: false,
          newLines: 1,
          align: "left",
          logoBase64String: "",
          barcode: "",
          qrcode: "",
          separator: "",
          fontType: "A",
          size: 1,
          autoCut: false,
        });

        print_arr.push({
          value:
            "" +
            stringEndToAddSpace("Taxes", 35) +
            stringFrontToAddSpace(
              number_format(data.report["Taxes"]),
              13 - number_format(data.report["Taxes"]).length
            ) +
            "",
          bold: false,
          underline: false,
          newLines: 1,
          align: "left",
          logoBase64String: "",
          barcode: "",
          qrcode: "",
          separator: "",
          fontType: "A",
          size: 1,
          autoCut: false,
        });

        print_arr.push({
          value:
            "" +
            stringEndToAddSpace("Total tendered", 35) +
            stringFrontToAddSpace(
              number_format(data.report["Total Tendered"]),
              13 - number_format(data.report["Total Tendered"]).length
            ) +
            "",
          bold: false,
          underline: false,
          newLines: 1,
          align: "left",
          logoBase64String: "",
          barcode: "",
          qrcode: "",
          separator: "",
          fontType: "A",
          size: 1,
          autoCut: false,
        });

        print_arr.push({
          value: "",
          bold: true,
          underline: true,
          newLines: 1,
          align: "center",
          separator: "-",
          logoBase64String: "",
          barcode: "",
          qrcode: "",
          fontType: "A",
          size: 1,
          autoCut: false,
        });

        print_arr.push({
          value: "Payment type wise sale",
          bold: false,
          underline: false,
          newLines: 1,
          align: "center",
          logoBase64String: "",
          barcode: "",
          qrcode: "",
          separator: "",
          fontType: "A",
          size: 1,
          autoCut: false,
        });

        for (c = 0; c < paymentypesales.length; c++) {
          var payment = paymentypesales[c];
          payment = JSON.stringify(payment);
          payment = payment.split(":");
          var regex = /[{""}]/g;

          print_arr.push({
            value:
              "" +
              stringEndToAddSpace(payment[0].replace(regex, " ").trim(), 35) +
              stringFrontToAddSpace(
                number_format(payment[1].replace(/}/g, "")),
                13 - number_format(payment[1].replace(/}/g, "")).length
              ) +
              "",
            bold: false,
            underline: false,
            newLines: 1,
            align: "left",
            logoBase64String: "",
            barcode: "",
            qrcode: "",
            separator: "",
            fontType: "A",
            size: 1,
            autoCut: false,
          });

          if (c == paymentypesales.length - 1) {
            print_arr.push({
              value: "",
              bold: true,
              underline: true,
              newLines: 2,
              align: "left",
              separator: "-",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });
          }
        }

        wscp.send(
          JSON.stringify({
            printerName: printer_name, //"POS80(2)",
            topLogoBase64String: "",
            autoCut: true,
            openDrawer: drawer,
            content: print_arr,
          })
        );
        sessionStorage.setItem("shift_day_end_id", "");
        $.notify("Printed successfully", {
          class: "success",
          id: "lang_print_success",
        });
        // console.log(print_arr);
      }
    };
  };
}

function AUTO_HOLD_BILL_PRINT(wscp, invoice_num) {
  var WEB_POS_currency_prefix = sessionStorage.getItem(
    "WEB_POS_currency_prefix"
  );
  var type1_arr = [];
  var type2_arr = [];
  var type3_arr = [];
  var type4_arr = [];
  var excluded_tax = 0;
  var included_tax = 0;
  var totalline_discount = 0;

  var openbillitem = "";
  var profileData = [];
  var productdiscount = [];
  var producttax = [];
  var print_arr = [];
  var get_openbill_tax = 0;
  var get_openbill_discount = 0;
  var curreny_prefix = sessionStorage.getItem("WEB_POS_currency_prefix");
  var r = indexedDB.open(db_name);
  var drawerstatus = 0;
  var printerType = 1; ///receipt=1; kot=2;
  var drawer = false;
  var printer_name=''; 
  r.onsuccess = function (event) {
    var db = event.target.result;

    var objectStore_printer = db
      .transaction(["printer_settings"], "readwrite")
      .objectStore("printer_settings");

    objectStore_printer.openCursor().onsuccess = function (event) {
      var cursor = event.target.result;
      if (cursor) {

        // if(cursor.value.printer_type==1 && cursor.value.printer_status==1){
        // printer_name = cursor.value.printer_name;

        // paper_size = cursor.value.paper_size;
        // printerType = cursor.value.printer_type;
        // // drawerstatus= cursor.value.drawer_status;
        // }
        cursor.continue();
      } else {
      }
    };

    var objectStoreproducttax = db
      .transaction(["invoice_tax"], "readwrite")
      .objectStore("invoice_tax");

    objectStoreproducttax.openCursor().onsuccess = function (event) {
      var cursor = event.target.result;

      if (cursor) {
        if (cursor.value.invoice_main_number == invoice_num) {
          producttax.push(cursor.value);
        }
        cursor.continue();
      } else {
        get_openbill_tax = producttax;
      }
    };

    var objectStorediscount = db
      .transaction(["invoice_discount"], "readwrite")
      .objectStore("invoice_discount");

    objectStorediscount.openCursor().onsuccess = function (event) {
      var cursor = event.target.result;

      if (cursor) {
        if (cursor.value.invoice_number == invoice_num) {
          productdiscount.push(cursor.value);
        }
        cursor.continue();
      } else {
        get_openbill_discount = productdiscount;
      }
    };

    var tb_invoice_kottemp = db
      .transaction(["invoice_kottemp"], "readwrite")
      .objectStore("invoice_kottemp");

    tb_invoice_kottemp.openCursor().onsuccess = function (event) {
      var cursor = event.target.result;

      if (cursor) {
        if (
          cursor.value.MainInvoiceNumber == invoice_num &&
          cursor.value.TypeNumber == 1 &&
          cursor.value.hold_invoice_delete_flag == 0 
        ) {
          type1_arr.push(cursor.value);
        }

        if (
          cursor.value.MainInvoiceNumber == invoice_num &&
          cursor.value.TypeNumber == 2 &&
          cursor.value.hold_invoice_delete_flag == 0 
        ) {
          type2_arr.push(cursor.value);
        }

        if (
          cursor.value.MainInvoiceNumber == invoice_num &&
          cursor.value.TypeNumber == 3 &&
          cursor.value.hold_invoice_delete_flag == 0 
        ) {
          type3_arr.push(cursor.value);
        }

        if (
          cursor.value.MainInvoiceNumber == invoice_num &&
          cursor.value.TypeNumber == 4 &&
          cursor.value.hold_invoice_delete_flag == 0 
        ) {
          type4_arr.push(cursor.value);
        }

        cursor.continue();
      } else {
        var objectStore_printer = db
          .transaction(["printer_settings"], "readwrite")
          .objectStore("printer_settings");

        objectStore_printer.openCursor().onsuccess = function (event) {
          var cursor = event.target.result;
          if (cursor) {

             if(cursor.value.printer_type==1 && cursor.value.printer_status==1){
            printer_name = cursor.value.printer_name;

            paper_size = cursor.value.paper_size;
             }  
            cursor.continue();
          } else {
            print_arr.push({
              value: "",
              bold: true,
              underline: true,
              newLines: 0,
              align: "center",
              separator: "-",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              fontType: "A",
              size: 3,
              autoCut: false,
            });

            print_arr.push({
              value:
                "" +
                stringEndToAddSpace(
                  "Pre bill #: " +
                    type1_arr[0].MainInvoiceNumber +
                    "(Pre bill)" +
                    "",
                  12
                ) +
                "",
              bold: false,
              underline: false,
              newLines: 0,
              align: "left",
              separator: "",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });
            var table_code = type1_arr[0].table_code;
            if (
              table_code == null ||
              table_code == ""
            ) {
              table_code = "";
            }else{
              table_code =type1_arr[0].table_code;
            }
            print_arr.push({
              value:
                "" +
                stringEndToAddSpace(
                  "Table: " +
                  table_code +
                    "",
                  12
                ) +
                "",
              bold: false,
              underline: false,
              newLines: 0,
              align: "left",
              separator: "",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });

            if (type1_arr[0].CustomerID != "COM1") {
              var store = db.transaction(["customer"], "readonly");
              var objectStore = store.objectStore("customer");

              var userIndex = objectStore.index("customer_id");
              var getRequest = userIndex.get(type1_arr[0].CustomerID);
              getRequest.onsuccess = (event) => {
                var row_data = getRequest.result;

                print_arr.push({
                  value:
                    "" +
                    stringEndToAddSpace(
                      "Cust. Name: " + row_data.customer_name + "",
                      12
                    ) +
                    "",
                  bold: false,
                  underline: false,
                  newLines: 0,
                  align: "left",
                  separator: "",
                  logoBase64String: "",
                  barcode: "",
                  qrcode: "",
                  fontType: "A",
                  size: 1,
                  autoCut: false,
                });
              };
            }

            if (
              type1_arr[0].order_type != null &&
              type1_arr[0].order_type != "" &&
              type1_arr[0].order_type != "N/A"
            ) {
              print_arr.push({
                value:
                  "" +
                  stringEndToAddSpace(
                    "Order type: " + type1_arr[0].order_type + "",
                    12
                  ) +
                  "",
                bold: false,
                underline: false,
                newLines: 0,
                align: "left",
                separator: "",
                logoBase64String: "",
                barcode: "",
                qrcode: "",
                fontType: "A",
                size: 1,
                autoCut: false,
              });
            }

            print_arr.push({
              value:
                "" +
                stringEndToAddSpace(
                  "Cashier: " + type1_arr[0].cashierName + "",
                  12
                ) +
                "",
              bold: false,
              underline: false,
              newLines: 0,
              align: "left",
              separator: "",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });

            print_arr.push({
              value:
                "" +
                stringEndToAddSpace(
                  "Date: " +
                    type1_arr[0].InvoiceDate +
                    " " +
                    type1_arr[0].InvoiceTime,
                  12
                ) +
                "",
              bold: false,
              underline: false,
              newLines: 0,
              align: "left",
              separator: "",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });

            print_arr.push({
              value: "",
              bold: true,
              underline: true,
              newLines: 0,
              align: "center",
              separator: "-",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              fontType: "A",
              size: 3,
              autoCut: false,
            });

            print_arr.push({
              value:
                "" +
                stringEndToAddSpace("Item price", 19) +
                stringEndToAddSpace("Qty", 4) +
                stringFrontToAddSpace("Total", 12) +
                "(" +
                curreny_prefix +
                ")",
              bold: false,
              underline: false,
              newLines: 0,
              align: "left",
              separator: "-",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });

            var subtotal = 0;

            get_openbill_product = type1_arr;
            var openbillproduct_data = alasql(
              'SELECT * FROM ? get_openbill_product LEFT JOIN ? load_product_arr ON get_openbill_product.itemcode=load_product_arr.product_code  WHERE get_openbill_product.lineNo!="0"  ORDER BY get_openbill_product.invoice_line_no DESC',
              [get_openbill_product, load_product_arr]
            );

            if (openbillproduct_data != "") {
              for (i = 0; i < openbillproduct_data.length; i++) {
                subtotal +=
                  parseFloat(openbillproduct_data[i].ItemPrice) *
                  parseFloat(openbillproduct_data[i].qty);

                //  var gettax=openbillproduct_data[i].product_tax_code.split(',');
                line_number = i + 1 + ".";
                line_space = 2;
                print_arr.push({
                  value:
                    "" +
                    line_number +
                    openbillproduct_data[i].product_name +
                    "",
                  bold: false,
                  underline: false,
                  logoBase64String: "",
                  newLines: 1,
                  align: "left",
                  separator: "",
                  barcode: "",
                  qrcode: "",
                  fontType: "A",
                  size: 1,
                  autoCut: false,
                });

                var tPrice = number_format(
                  openbillproduct_data[i].ItemPrice *
                    openbillproduct_data[i].qty
                );

                print_arr.push({
                  value:
                    "" +
                    stringEndToAddSpace(
                      stringFrontToAddSpace(
                        number_format(openbillproduct_data[i].ItemPrice),
                        line_space
                      ),
                      19
                    ) +
                    stringEndToAddSpace(
                      number_format(openbillproduct_data[i].qty),
                      8
                    ) +
                    stringFrontToAddSpace(tPrice, 8) +
                    "",
                  bold: false,
                  underline: false,
                  logoBase64String: "",
                  newLines: 1,
                  align: "left",
                  separator: "",
                  barcode: "",
                  qrcode: "",
                  fontType: "A",
                  size: 1,
                  autoCut: false,
                });

                var openbilldiscount_data = alasql(
                  'SELECT * FROM ? get_openbill_discount WHERE get_openbill_discount.invoice_number="' +
                    invoice_num +
                    '" AND get_openbill_discount.line_number=' +
                    openbillproduct_data[i].lineNo +
                    'OR get_openbill_discount.line_number="' +
                    openbillproduct_data[i].lineNo +
                    '"',
                  [get_openbill_discount]
                );

                if (openbilldiscount_data.length > 0) {
                  if (openbilldiscount_data[0].discount_value > 0) {
                    var taxtype =
                      "(" + openbilldiscount_data[0].discount_ref + "%)";

                    if (
                      openbilldiscount_data[0].discount_type != "Percentage"
                    ) {
                      taxtype =
                        "(" + openbilldiscount_data[0].discount_ref + ")";
                    }
                    print_arr.push({
                      value: stringFrontToAddSpace(
                        "-" +
                          "Discount" +
                          taxtype +
                          ":" +
                          number_format(
                            openbilldiscount_data[0].discount_value
                          ) +
                          "",
                        line_space
                      ),
                      bold: false,
                      underline: false,
                      logoBase64String: "",
                      newLines: 1,
                      align: "left",
                      separator: "",
                      barcode: "",
                      qrcode: "",
                      fontType: "A",
                      size: 1,
                      autoCut: false,
                    });

                    totalline_discount += parseFloat(
                      openbilldiscount_data[0].discount_value
                    );
                  }
                }

                var openbilltax_data = alasql(
                  'SELECT * FROM ? get_openbill_tax WHERE get_openbill_tax.invoice_main_number="' +
                    invoice_num +
                    '" AND get_openbill_tax.invoice_itemcode="' +
                    openbillproduct_data[i].itemcode +
                    '" AND get_openbill_tax.invoice_line_no="' +
                    openbillproduct_data[i].lineNo +
                    '"',
                  [get_openbill_tax]
                );

                if (openbilltax_data.length > 0) {
                  for (x = 0; x < openbilltax_data.length; x++) {
                    var taxtype = "-Included";
                    if (openbilltax_data[x].tax_type != "2") {
                      taxtype = "";
                      excluded_tax += parseFloat(openbilltax_data[x].item_tax);
                    } else {
                      included_tax += parseFloat(openbilltax_data[x].item_tax);
                    }

                    print_arr.push({
                      value: stringFrontToAddSpace(
                        "+" +
                          openbilltax_data[x].tax_code +
                          "(" +
                          openbilltax_data[x].tax_percentage +
                          "%):(" +
                          number_format(openbilltax_data[x].item_tax) +
                          "" +
                          taxtype +
                          ")",
                        line_space
                      ),
                      bold: false,
                      underline: false,
                      logoBase64String: "",
                      newLines: 1,
                      align: "left",
                      separator: "",
                      barcode: "",
                      qrcode: "",
                      fontType: "A",
                      size: 1,
                      autoCut: false,
                    });
                  }
                }

                print_arr.push({
                  value: "",
                  bold: false,
                  underline: false,
                  logoBase64String: "",
                  newLines: 1,
                  align: "left",
                  separator: " ",
                  barcode: "",
                  qrcode: "",
                  fontType: "A",
                  size: 1,
                  autoCut: false,
                });
              }
            }

            print_arr.push({
              value: "",
              bold: true,
              underline: true,
              newLines: 0,
              align: "center",
              separator: "-",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              fontType: "A",
              size: 3,
              autoCut: false,
            });

            print_arr.push({
              value:
                "" +
                stringEndToAddSpace(
                  "Subtotal" + "(" + curreny_prefix + ")",
                  35
                ) +
                stringFrontToAddSpace(
                  number_format(subtotal),
                  10 - number_format(subtotal).length
                ) +
                "",
              bold: false,
              underline: false,
              logoBase64String: "",
              newLines: 1,
              align: "left",
              separator: "",
              barcode: "",
              qrcode: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });

            if (totalline_discount > 0) {
              print_arr.push({
                value:
                  "" +
                  stringEndToAddSpace(
                    "Total line discount" + "(" + curreny_prefix + ")",
                    35
                  ) +
                  stringFrontToAddSpace(
                    number_format(totalline_discount),
                    10 - number_format(totalline_discount).length
                  ) +
                  "",
                bold: false,
                underline: false,
                logoBase64String: "",
                newLines: 1,
                align: "left",
                separator: "",
                barcode: "",
                qrcode: "",
                fontType: "A",
                size: 1,
                autoCut: false,
              });
            }
            if (included_tax > 0) {
              print_arr.push({
                value:
                  "" +
                  stringEndToAddSpace(
                    "Tax Include in the Price" + "(" + curreny_prefix + ")",
                    35
                  ) +
                  stringFrontToAddSpace(
                    number_format(included_tax),
                    10 - number_format(included_tax).length
                  ) +
                  "",
                bold: false,
                underline: false,
                logoBase64String: "",
                newLines: 1,
                align: "left",
                separator: "",
                barcode: "",
                qrcode: "",
                fontType: "A",
                size: 1,
                autoCut: false,
              });
            }

            if (excluded_tax > 0) {
              print_arr.push({
                value:
                  "" +
                  stringEndToAddSpace(
                    "Tax Exclude in the Price" + "(" + curreny_prefix + ")",
                    35
                  ) +
                  stringFrontToAddSpace(
                    number_format(excluded_tax),
                    10 - number_format(excluded_tax).length
                  ) +
                  "",
                bold: false,
                underline: false,
                logoBase64String: "",
                newLines: 1,
                align: "left",
                separator: "",
                barcode: "",
                qrcode: "",
                fontType: "A",
                size: 1,
                autoCut: false,
              });
            }

            var openbilltotal_discount = alasql(
              'SELECT * FROM ? get_openbill_discount WHERE get_openbill_discount.invoice_number="' +
                invoice_num +
                '" AND get_openbill_discount.line_number=""',
              [get_openbill_discount]
            );

            if (openbilltotal_discount.length > 0) {
              var distype = "(" + openbilltotal_discount[0].discount_ref + "%)";

              if (openbilltotal_discount[0].discount_type != "Percentage") {
                distype = "(" + openbilltotal_discount[0].discount_ref + ")";
              }
              if (openbilltotal_discount[0].discount_value > 0) {
                print_arr.push({
                  value:
                    "" +
                    stringEndToAddSpace(
                      "Total discoun" + distype + "(" + curreny_prefix + ")",
                      35
                    ) +
                    stringFrontToAddSpace(
                      number_format(openbilltotal_discount[0].discount_value),
                      10 -
                        number_format(openbilltotal_discount[0].discount_value)
                          .length
                    ) +
                    "",
                  bold: false,
                  underline: false,
                  logoBase64String: "",
                  newLines: 1,
                  align: "left",
                  separator: "",
                  barcode: "",
                  qrcode: "",
                  fontType: "A",
                  size: 1,
                  autoCut: false,
                });
              }
            }
            for (i = 0; i < type2_arr.length; i++) {
              var vlType = "(" + type2_arr[i].Reference + "%)";
              if (type2_arr[i].ValueType != "Percentage") {
                vlType = "";
              }

              var taxmode = "-Include";
              if (type2_arr[i].tax_mode != "Include") {
                taxmode = "";
              }

              print_arr.push({
                value:
                  stringEndToAddSpace(
                    type2_arr[i].itemcode +
                      vlType +
                      taxmode +
                      "(" +
                      curreny_prefix +
                      ")",
                    35
                  ) +
                  stringFrontToAddSpace(
                    number_format(type2_arr[i].ItemPrice),
                    10 - number_format(type2_arr[i].ItemPrice).length
                  ) +
                  "",
                bold: false,
                underline: false,
                logoBase64String: "",
                newLines: 1,
                align: "left",
                separator: "",
                barcode: "",
                qrcode: "",
                fontType: "A",
                size: 1,
                autoCut: false,
              });
            }

            for (i = 0; i < type4_arr.length; i++) {
              var vlType = "(" + type4_arr[i].Reference + "%)";
              if (type4_arr[i].ValueType != "Percentage") {
                vlType = "(" + type4_arr[i].Reference + ")";
              }

              var taxmode = "Include";
              if (type4_arr[i].tax_mode != "Include") {
                taxmode = "";
              }

              print_arr.push({
                value:
                  stringEndToAddSpace(
                    type4_arr[i].itemcode +
                      vlType +
                      taxmode +
                      "(" +
                      curreny_prefix +
                      ")",
                    35
                  ) +
                  stringFrontToAddSpace(
                    number_format(type4_arr[i].ItemPrice),
                    10 - number_format(type4_arr[i].ItemPrice).length
                  ) +
                  "",
                bold: false,
                underline: false,
                logoBase64String: "",
                newLines: 1,
                align: "left",
                separator: "",
                barcode: "",
                qrcode: "",
                fontType: "A",
                size: 1,
                autoCut: false,
              });
            }

            print_arr.push({
              value: "",
              bold: true,
              underline: true,
              newLines: 0,
              align: "center",
              separator: "-",
              logoBase64String: "",
              barcode: "",
              qrcode: "",
              fontType: "A",
              size: 3,
              autoCut: false,
            });

            print_arr.push({
              value:
                "" +
                stringEndToAddSpace(
                  "Grand Total" + "(" + curreny_prefix + ")",
                  35
                ) +
                stringFrontToAddSpace(
                  number_format(type1_arr[0].InvoiceTotal),
                  10 - number_format(type1_arr[0].InvoiceTotal).length
                ) +
                "",
              bold: false,
              underline: false,
              logoBase64String: "",
              newLines: 1,
              align: "left",
              separator: "",
              barcode: "",
              qrcode: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });

            print_arr.push({
              value: "" + stringEndToAddSpace("Signature :", 35) + "",
              bold: false,
              underline: false,
              logoBase64String: "",
              newLines: 1,
              align: "left",
              separator: "",
              barcode: "",
              qrcode: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });

            print_arr.push({
              value:
                "" +
                stringEndToAddSpace("", 11) +
                stringFrontToAddSpace("-------------------------------------") +
                "",
              bold: false,
              underline: false,
              logoBase64String: "",
              newLines: 1,
              align: "left",
              separator: "",
              barcode: "",
              qrcode: "",
              fontType: "A",
              size: 1,
              autoCut: false,
            });
//console.log(print_arr);
            wscp.send(
              JSON.stringify({
                printerName: printer_name, //"POS80(2)",
                topLogoBase64String: "",
                autoCut: true,
                openDrawer: drawer,
                content: print_arr,
              })
            );
            $.notify("Printed successfully", {
              class: "success",
              id: "lang_print_success",
            });
          }
        };
      }
    };
  };
}

function OPEN_DRAWER() {
  var wscp;
  var print_arr = [];
  if ("WebSocket" in window) {
    // init the websocket client ws://localhost:6690/add
    wscp = new WebSocket("ws://127.0.0.1:7890/POSMSGES");
    wscp.onopen = function () {
      // console.log("/PRINTERS : connected");

      var r = indexedDB.open(db_name);
      var printer_name = "";
      r.onsuccess = function (event) {
        var db = event.target.result;
        var objectStore_printer = db
          .transaction(["printer_settings"], "readwrite")
          .objectStore("printer_settings");

        objectStore_printer.openCursor().onsuccess = function (event) {
          var cursor = event.target.result;
          if (cursor) {
            printer_name = cursor.value.printer_name;

            cursor.continue();
          } else {
            wscp.send(
              JSON.stringify({
                printerName: printer_name,
                topLogoBase64String: "",
                autoCut: false,
                openDrawer: true,
                content: [],
              })
            );
          }
        };
      };
    };

    wscp.onclose = function () {};

    wscp.onmessage = function (e) {};
  }
}

function PRINT_KOT(wscp) {
  //console.log(sessionStorage.getItem("reservedTables"));
var WEB_POS_currency_prefix = sessionStorage.getItem("WEB_POS_currency_prefix");
var type1_arr = [];
var type2_arr = [];
var type3_arr = [];
var type4_arr = [];
var excluded_tax = 0;
var included_tax = 0;
var totalline_discount = 0;

var openbillitem = "";
var profileData = [];
var productdiscount = [];
var producttax = [];

var get_openbill_tax = 0;
var get_openbill_discount = 0;
var curreny_prefix = sessionStorage.getItem("WEB_POS_currency_prefix");
var r = indexedDB.open(db_name);
var drawerstatus = 0;
var printerType = 1; ///receipt=1; kot=2;
var drawer = false;

var kot_group = 0;
var kot_groupall = [];
var kotgroups = "";
var kot_print_data = [];
var kot_print_kot = [];
var printername = [];
var printername_kotgroup = [];
r.onsuccess = function (event) {
  var db = event.target.result;

  var store = db.transaction(["invoice_kot_printer_groups"], "readonly");
  var objectStore = store.objectStore("invoice_kot_printer_groups");
  var userIndex = objectStore.index("group_id");
  var getRequest = userIndex.getAll();
  getRequest.onsuccess = (event) => {
    kot_group = getRequest.result;
    //kot_groupall.push(kot_group);

    
    var tb_invoice_kottemp = db
      .transaction(["invoice_kot_printer_notes"], "readwrite")
      .objectStore("invoice_kot_printer_notes");

    tb_invoice_kottemp.openCursor().onsuccess = function (event) {
      var cursor = event.target.result;

      if (cursor) {
        type1_arr.push(cursor.value);

        cursor.continue();
      } else {
        var objectStore_printer = db
          .transaction(["printer_settings"], "readwrite")
          .objectStore("printer_settings");

        objectStore_printer.openCursor().onsuccess = function (event) {
          var cursor = event.target.result;
          if (cursor) {
            if (
              cursor.value.kot_bot_status == 1 &&
              cursor.value.printer_status == 1
            ) {
              // printer_name = cursor.value.printer_name;kot_print_kot
              printer_data = {
                printername: cursor.value.printer_name,
                printkottarget: cursor.value.kot_target,
              };
			  
			  var pri_kot=cursor.value.kot_target;
			  
			  var arrln=pri_kot.split(',');
			  // console.log(cursor.value.kot_target);
        //    console.log(cursor.value.printer_name);
			  if(arrln.length > 0){
			  
			    for(var g=0; g < arrln.length; g++){
				
					if(arrln[g]!=''){
						 kot_print_data.push(cursor.value.printer_name);
						kot_print_kot.push(arrln[g]);
					
					}
				
				}
			  
			  }else{
			  
				 kot_print_data.push(cursor.value.printer_name);
                 kot_print_kot.push(cursor.value.kot_target);
			  
			  }
			  
			  
              
            }

            cursor.continue();
          }else{

          // console.log(type1_arr);
           if(type1_arr.length > 0){
         //   console.log(kot_print_kot);
            for (var x = 0; x < kot_print_data.length; x++) {
				
				 
				 for (var j = 0; j < kot_group.length; j++) {
					if(kot_print_kot[x]==kot_group[j].group_id){
					  
					   printername.push(kot_print_data[x]);
            printername_kotgroup.push(kot_group[j].group_name);
					
					}
				 
				 }
				
				}
				
				//console.log(printername);
				//console.log(printername_kotgroup);
                for (var k = 0; k < printername.length; k++) {
                  var printer_name = printername[k];
                 
                // printer_name
                  var print_arr = []; 
                  
                 print_arr.push({
                        value: "",
                        bold: true,
                        underline: true,
                        newLines: 0,
                        align: "center",
                        separator: "-",
                        logoBase64String: "",
                        barcode: "",
                        qrcode: "",
                        fontType: "A",
                        size: 3,
                        autoCut: false,
                      });

                      var kot_title = "Kitchen Order";
                      if ($(".billing").hasClass("view_bck_image")) {
                        kot_title = "Kitchen order update";
                      }

                      print_arr.push({
                        value: "" + stringEndToAddSpace(kot_title, 12) + "",
                        bold: false,
                        underline: false,
                        newLines: 0,
                        align: "center",
                        separator: "",
                        logoBase64String: "",
                        barcode: "",
                        qrcode: "",
                        fontType: "A",
                        size: 2,
                        autoCut: false,
                      });
                      var table_code = sessionStorage.getItem("reservedTables");
                      if (
                        table_code == null ||
                        table_code == ""
                      ) {
                        table_code = "";
                      }else{
                        table_code =sessionStorage.getItem("reservedTables");
                      }
                      print_arr.push({
                        value:
                          "" +
                          stringEndToAddSpace(
                            "Table: " +
                            table_code +
                              "",
                            12
                          ) +
                          "",
                        bold: false,
                        underline: false,
                        newLines: 0,
                        align: "left",
                        separator: "",
                        logoBase64String: "",
                        barcode: "",
                        qrcode: "",
                        fontType: "A",
                        size: 1,
                        autoCut: false,
                      });
                      print_arr.push({
                        value:
                          "" +
                          stringEndToAddSpace(
                            "KOT #" + type1_arr[0].kot_num + "",
                            12
                          ) +
                          "",
                        bold: false,
                        underline: false,
                        newLines: 0,
                        align: "center",
                        separator: "",
                        logoBase64String: "",
                        barcode: "",
                        qrcode: "",
                        fontType: "A",
                        size: 2,
                        autoCut: false,
                      });

                      print_arr.push({
                        value: "",
                        bold: true,
                        underline: true,
                        newLines: 0,
                        align: "center",
                        separator: "-",
                        logoBase64String: "",
                        barcode: "",
                        qrcode: "",
                        fontType: "A",
                        size: 1,
                        autoCut: false,
                      });
                      print_arr.push({
                        value:
                          "" +
                          stringEndToAddSpace(
                            "Receipt Temp #: " +
                              type1_arr[0].kot_invoice_num +
                              "",
                            12
                          ) +
                          "",
                        bold: false,
                        underline: false,
                        newLines: 0,
                        align: "left",
                        separator: "",
                        logoBase64String: "",
                        barcode: "",
                        qrcode: "",
                        fontType: "A",
                        size: 1,
                        autoCut: false,
                      });

                      print_arr.push({
                        value:
                          "" +
                          stringEndToAddSpace("" + currentDate + "", 12) +
                          "",
                        bold: false,
                        underline: false,
                        newLines: 0,
                        align: "left",
                        separator: "",
                        logoBase64String: "",
                        barcode: "",
                        qrcode: "",
                        fontType: "A",
                        size: 1,
                        autoCut: false,
                      });

                      print_arr.push({
                        value:
                          "" +
                          stringEndToAddSpace(
                            "Cashier name: " +
                              sessionStorage.getItem("user_name") +
                              "",
                            12
                          ) +
                          "",
                        bold: false,
                        underline: false,
                        newLines: 0,
                        align: "left",
                        separator: "",
                        logoBase64String: "",
                        barcode: "",
                        qrcode: "",
                        fontType: "A",
                        size: 1,
                        autoCut: false,
                      });
                      var table_code = sessionStorage.getItem("reservedTables");
                      if (
                        table_code == null ||
                        table_code == ""
                      ) {
                        table_code = "";
                      }else{
                        table_code =sessionStorage.getItem("reservedTables");
                      }
                      print_arr.push({
                        value:
                          "" +
                          stringEndToAddSpace(
                            "Table: " +
                            table_code +
                              "",
                            12
                          ) +
                          "",
                        bold: false,
                        underline: false,
                        newLines: 0,
                        align: "left",
                        separator: "",
                        logoBase64String: "",
                        barcode: "",
                        qrcode: "",
                        fontType: "A",
                        size: 1,
                        autoCut: false,
                      });

                      print_arr.push({
                        value:
                          "" +
                          stringEndToAddSpace(
                            "KOT target: " + printername_kotgroup[k] + "",
                            12
                          ) +
                          "",
                        bold: false,
                        underline: false,
                        newLines: 0,
                        align: "left",
                        separator: "",
                        logoBase64String: "",
                        barcode: "",
                        qrcode: "",
                        fontType: "A",
                        size: 1,
                        autoCut: false,
                      });

                      if (
                        type1_arr[0].kot_order_type != null &&
                        type1_arr[0].kot_order_type != "" &&
                        type1_arr[0].kot_order_type != undefined &&
                        type1_arr[0].kot_order_type != "N/A"
                      ) {
                        print_arr.push({
                          value:
                            "" +
                            stringEndToAddSpace(
                              "Order type: " + type1_arr[0].kot_order_type + "",
                              12
                            ) +
                            "",
                          bold: false,
                          underline: false,
                          newLines: 0,
                          align: "left",
                          separator: "",
                          logoBase64String: "",
                          barcode: "",
                          qrcode: "",
                          fontType: "A",
                          size: 1,
                          autoCut: false,
                        });
                      }

                      print_arr.push({
                        value: "",
                        bold: true,
                        underline: true,
                        newLines: 0,
                        align: "center",
                        separator: "-",
                        logoBase64String: "",
                        barcode: "",
                        qrcode: "",
                        fontType: "A",
                        size: 3,
                        autoCut: false,
                      });

                      print_arr.push({
                        value:
                          "" +
                          stringEndToAddSpace("Item", 25) +
                          stringFrontToAddSpace("Qty", 12),
                        bold: false,
                        underline: false,
                        newLines: 0,
                        align: "left",
                        separator: "-",
                        logoBase64String: "",
                        barcode: "",
                        qrcode: "",
                        fontType: "A",
                        size: 1,
                        autoCut: false,
                      });

                      var prlegth=[];
                  for (var i = 0; i < type1_arr.length; i++) {

                    
                    //print_arr.push(type1_arr[i]);console.log(type1_arr[i])
                     
                    if (printername_kotgroup[k]==type1_arr[i].kot_target) {
                     
                        prlegth.push(1);
                      //print_arr.push(type1_arr[i]);console.log(type1_arr[i])
                       var txt = "";
                          if (type1_arr[i].status == 0) {
                            txt = "(CANCEL)";
                          }
                          print_arr.push({
                            value:
                              "" +
                              stringEndToAddSpace(
                                type1_arr[i].product_name,
                                25
                              ) +
                              stringFrontToAddSpace(type1_arr[i].qty + txt, 12),
                            bold: false,
                            underline: false,
                            logoBase64String: "",
                            newLines: 1,
                            align: "left",
                            separator: "",
                            barcode: "",
                            qrcode: "",
                            fontType: "A",
                            size: 1,
                            autoCut: false,
                          });

var alllength = type1_arr[i].notes.split(",");

                      if (type1_arr[i].notes != "") {
                        for (var r = 0; r < alllength.length; r++) {
                          print_arr.push({
                            value: "" + stringEndToAddSpace(alllength[r], 25),
                            bold: false,
                            underline: false,
                            newLines: 1,
                            align: "left",
                            logoBase64String: "",
                            barcode: "",
                            qrcode: "",
                            separator: "",
                            fontType: "A",
                            size: 1,
                            autoCut: false,
                          });
                        }
                      }
                      print_arr.push({
                          value: "",
                          bold: true,
                          underline: true,
                          newLines: 0,
                          align: "center",
                          separator: " ",
                          logoBase64String: "",
                          barcode: "",
                          qrcode: "",
                          fontType: "A",
                          size: 3,
                          autoCut: false,
                        });
                    }
                    
                        if (type1_arr[i].status == 0) {
                        print_arr.push({
                          value: "",
                          bold: true,
                          underline: true,
                          newLines: 0,
                          align: "center",
                          separator: " ",
                          logoBase64String: "",
                          barcode: "",
                          qrcode: "",
                          fontType: "A",
                          size: 3,
                          autoCut: false,
                        });
                      }
                      

                      
                     
                  }
                  if (type1_arr[0].kot_comment!= "" && type1_arr[0].kot_comment!=undefined) {
                          
                            print_arr.push({
                              value: "" + stringEndToAddSpace(type1_arr[0].kot_comment, 25),
                              bold: false,
                              underline: false,
                              newLines: 1,
                              align: "left",
                              logoBase64String: "",
                              barcode: "",
                              qrcode: "",
                              separator: "",
                              fontType: "A",
                              size: 1,
                              autoCut: false,
                            });
                          
                        }

                        if(prlegth.length==0){
                          print_arr=[];
                        }

                       //console.log(print_arr);
                 
                 if (printer_name != "" && print_arr.length > 0) {
                      
                        //if (i == type1_arr.length - 1) {
                       wscp.send(
                         JSON.stringify({
                          printerName: printer_name, //"POS80(2)",
                          topLogoBase64String: "",
                          autoCut: true,
                         openDrawer: false,
                         content: print_arr,
                        })
                       );
                      
                        if(k==printername.length-1){
                       $.notify("Printed successfully", {
                         class: "success",
                         id: "lang_print_success",
                       });
                      }
                       HOLDBILL_CLEAR_DATA();
                       
                       // }
                     } else {
                      //  $(".jconfirm-buttons").prepend(
                      //    "<label >Connection faild</label>"
                      //  );
                     }
                }
                

              }else{

              }
              }
            }

             
                
                
             
            };

          }

          
        };
      }
    };
  

//PRINT_KOT();
