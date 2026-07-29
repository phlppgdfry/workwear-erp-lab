codeunit 50100 "Variant Pricing Mgt"
{
    // Business rule: customized garments (embroidery/logo) carry a flat setup
    // fee plus a per-character fee, mirroring how custom-made workwear brands
    // typically price personalization versus stock product.
    var
        FlatSetupFee: Decimal;
        PerCharacterFee: Decimal;

    trigger OnRun()
    begin
    end;

    procedure ApplyEmbroiderySurcharge(var SalesLine: Record "Sales Line")
    var
        Surcharge: Decimal;
    begin
        FlatSetupFee := 4.5;
        PerCharacterFee := 0.35;

        if SalesLine."Embroidery Text" = '' then begin
            SalesLine."Embroidery Surcharge" := 0;
            exit;
        end;

        Surcharge := FlatSetupFee + (StrLen(SalesLine."Embroidery Text") * PerCharacterFee);
        SalesLine."Embroidery Surcharge" := Surcharge;
        SalesLine.Validate("Unit Price", SalesLine."Unit Price" + Surcharge);
    end;
}
