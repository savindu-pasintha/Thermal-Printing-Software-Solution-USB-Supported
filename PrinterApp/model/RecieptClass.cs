using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EscPOSThermalPrinter.model
{
    internal class RecieptClass
    {
        public string printerName { get; set; }
        public string printerLogoBase64 { get; set; }
        public string addressLineOne { get; set; }
        public string addressLineTwo { get; set; }
        public string addressLineThree { get; set; }
        public string contactNumber { get; set; }

        public string reciept { get; set; }
        public string cashier { get; set; }
        public string customer { get; set; }
        public string date { get; set; }
        public string paymentType { get; set; }

        public string subTotal { get; set; }
        public string grandTotal { get; set; }
        public string cash { get; set; }
        public string balance { get; set; }
        public string currencyType { get; set; }
        public string endMessage { get; set; }
        public char separator { get; set; }
        public string autoCut { get; set; }
        public string email { get; set; }

        //public List<Products> products { get; set; }
        public ArrayList products { get; set; }
    }

}
