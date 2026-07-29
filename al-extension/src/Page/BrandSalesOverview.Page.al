page 50103 "Brand Sales Overview"
{
    PageType = List;
    SourceTable = "Brand Sales Buffer";
    SourceTableTemporary = true;
    Caption = 'Brand Sales Overview';
    Editable = false;

    layout
    {
        area(Content)
        {
            repeater(General)
            {
                field("Brand Code"; Rec."Brand Code") { ApplicationArea = All; }
                field("Company Name"; Rec."Company Name") { ApplicationArea = All; }
                field("Posted Invoice Count"; Rec."Posted Invoice Count") { ApplicationArea = All; }
                field("Total Sales Amount"; Rec."Total Sales Amount") { ApplicationArea = All; }
            }
        }
    }

    procedure SetRecords(var SourceBuffer: Record "Brand Sales Buffer" temporary)
    begin
        if SourceBuffer.FindSet() then
            repeat
                Rec := SourceBuffer;
                Rec.Insert();
            until SourceBuffer.Next() = 0;
    end;
}
