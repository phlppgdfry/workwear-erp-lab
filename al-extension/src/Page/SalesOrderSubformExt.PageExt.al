pageextension 50100 "Sales Order Subform Ext" extends "Sales Order Subform"
{
    layout
    {
        addafter(Description)
        {
            field("Product Size"; Rec."Product Size")
            {
                ApplicationArea = All;
                ToolTip = 'Specifies the garment size for this line.';
            }
            field("Product Color"; Rec."Product Color")
            {
                ApplicationArea = All;
                ToolTip = 'Specifies the garment color for this line.';
            }
            field("Embroidery Text"; Rec."Embroidery Text")
            {
                ApplicationArea = All;
                ToolTip = 'Specifies logo/embroidery text to personalize this item. Adding text applies a customization surcharge automatically.';
            }
            field("Embroidery Surcharge"; Rec."Embroidery Surcharge")
            {
                ApplicationArea = All;
                ToolTip = 'Specifies the surcharge applied for personalization, calculated from the embroidery text.';
            }
        }
    }
}
