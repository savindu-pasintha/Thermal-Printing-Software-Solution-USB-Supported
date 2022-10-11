using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EscPOSThermalPrinter.model
{
    internal class Content { 
     public Boolean bold { get; set; }
    public Boolean underline { get; set; }

    public Boolean autoCut { get; set; }

    public string separator { get; set; }
    public string value { get; set; }
    public string logoBase64String { get; set; }
    public int newLines { get; set; }
    public string align { get; set; }
    public string fontType { get; set; }

    public int size { get; set; }
    public string barcode { get; set; }
    public string qrcode { get; set; }

}
}
