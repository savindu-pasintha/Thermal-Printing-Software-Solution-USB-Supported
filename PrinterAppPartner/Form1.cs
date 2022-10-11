using System;
using System.Collections;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using ESC_POS_USB_NET.Printer;
using ESC_POS_USB_NET.Enums;
using System.Windows.Controls;
using System.Windows.Shapes;
using SkiaSharp;
using System.IO;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using Microsoft.Win32;

namespace PrinterApp
{
    public partial class Form1 : Form
    {
        // The path to the key where Windows looks for startup applications
        private const int CP_NOCLOSE_BUTTON = 0x200;
        private const int WS_CAPTION = 0x00C00000;
        string printerName = "";
        RegistryKey rkApp = Registry.CurrentUser.OpenSubKey("SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run", true);

        // Removes the close button in the caption bar
        protected override CreateParams CreateParams
        {
            get
            {
                CreateParams myCp = base.CreateParams;

                // This disables the close button
                myCp.ClassStyle = myCp.ClassStyle | CP_NOCLOSE_BUTTON;

                // this appears to completely remove the close button adn min / mximize
                //myCp.Style &= WS_CAPTION;

                return myCp;
            }
        }

        
        public Form1()
        {
            InitializeComponent();
            
            if (rkApp.GetValue("EscPOSThermalPrinterAppAutoRunaa") == null)
            {
                rkApp.SetValue("EscPOSThermalPrinterAppAutoRunaa", Application.ExecutablePath.ToString());
            }

            if (System.Drawing.Printing.PrinterSettings.InstalledPrinters.Count > 0)
            {
                //comboBox1.Size = new Size(250, 58);
                comboBox1.Text = "Select printer driver";
               
                foreach (string printer in System.Drawing.Printing.PrinterSettings.InstalledPrinters)
                {
                    comboBox1.Items.Add(printer);
                }
                //comboBox1.Items.Add("Close The Program");
            }

            comboBox1.Enabled = false;
            comboBox1.Hide();
            xuiButton1.Enabled = false;
            xuiButton1.Hide();
        }
       
        //Test Print
        private void button1_Click(object sender, EventArgs e)
        {
           

        }


        private void Form1_Load(object sender, EventArgs e)
        {
           
        }

        private void comboBox1_SelectedIndexChanged(object sender, EventArgs e)
        {
            if (comboBox1.SelectedItem.ToString() != "" && comboBox1.SelectedItem.ToString() != null)
            {
                if (comboBox1.SelectedItem.ToString() == "Close The Program")
                {
                    xuiButton1.Enabled = true;
                    label1.Text = "Do you want to close the program ?";
                    label1.ForeColor = Color.Red;
                    xuiButton1.ButtonText = "Close";
                }
                else
                {
                    printerName = comboBox1.SelectedItem.ToString();
                    label1.Text = "Selected .. !";
                    label1.ForeColor = Color.Green;
                    xuiButton1.Enabled = true;
                }
            }
            else
            {
                xuiButton1.Enabled = false;
            }
        }

        private void xuiButton1_Click(object sender, EventArgs e)
        { 
            if (printerName.ToString() != "" && printerName.ToString() != null)
            {

                if (printerName.ToString() == "Close The Program")
                {
                    this.Close();
                }
                else
                {
                    try
                    {
                        Printer printer = new Printer(printerName);
                        printer.TestPrinter();
                        printer.FullPaperCut();
                        printer.PrintDocument();

                        //label1.Text = "Successfuly Printed !";
                        //label1.ForeColor = Color.Green;
                    }
                    catch (Exception ex)
                    {
                        label1.Text = "Please select correct printer Driver !";
                        label1.ForeColor = Color.Red;

                    }
                    finally
                    {
                        xuiButton1.Enabled = false;
                    }
                }

            }
        }

        private void label2_Click(object sender, EventArgs e)
        {

        }

        private void pictureBox1_Click(object sender, EventArgs e)
        {

        }

        private void label1_Click(object sender, EventArgs e)
        {

        }

        private void label2_Click_1(object sender, EventArgs e)
        {

        }

        private void label3_Click(object sender, EventArgs e)
        {

        }
    }
}
