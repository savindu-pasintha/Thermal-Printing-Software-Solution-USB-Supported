using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EscPOSThermalPrinter.model
{
    internal class RecieptJsonClass
    {
        public Boolean autoCut { get; set; }

        public Boolean openDrawer { get; set; }

        public string printerName { get; set; }
        public string topLogoBase64String { get; set; }
        public ArrayList content { get; set; }

    }
}
