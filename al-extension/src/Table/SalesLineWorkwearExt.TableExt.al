tableextension 50100 "Sales Line Workwear Ext" extends "Sales Line"
{
    fields
    {
        field(50100; "Product Size"; Code[10])
        {
            Caption = 'Size';
            DataClassification = CustomerContent;
        }
        field(50101; "Product Color"; Code[20])
        {
            Caption = 'Color';
            DataClassification = CustomerContent;
        }
        field(50102; "Embroidery Text"; Text[50])
        {
            Caption = 'Embroidery / Logo Text';
            DataClassification = CustomerContent;

            trigger OnValidate()
            var
                VariantPricingMgt: Codeunit "Variant Pricing Mgt";
            begin
                VariantPricingMgt.ApplyEmbroiderySurcharge(Rec);
            end;
        }
        field(50103; "Embroidery Surcharge"; Decimal)
        {
            Caption = 'Embroidery Surcharge';
            DataClassification = CustomerContent;
            AutoFormatType = 2;
            Editable = false;
        }
    }
}
