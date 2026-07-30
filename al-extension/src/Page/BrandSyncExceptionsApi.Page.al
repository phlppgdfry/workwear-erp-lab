page 50104 "Brand Sync Exceptions API"
{
    PageType = API;
    SourceTable = "Brand Sync Exception";
    APIPublisher = 'portfoliolab';
    APIGroup = 'workwear';
    APIVersion = 'v1.0';
    EntityName = 'syncException';
    EntitySetName = 'syncExceptions';
    DelayedInsert = true;
    ODataKeyFields = SystemId;

    layout
    {
        area(Content)
        {
            repeater(General)
            {
                field(entryNo; Rec."Entry No.") { Caption = 'Entry No.'; }
                field(brandCode; Rec."Brand Code") { Caption = 'Brand Code'; }
                field(sourceSystem; Rec."Source System") { Caption = 'Source System'; }
                field(orderReference; Rec."Order Reference") { Caption = 'Order Reference'; }
                field(errorMessage; Rec."Error Message") { Caption = 'Error Message'; }
                field(occurredAt; Rec."Occurred At") { Caption = 'Occurred At'; }
                field(resolved; Rec.Resolved) { Caption = 'Resolved'; }
                field(resolvedAt; Rec."Resolved At") { Caption = 'Resolved At'; }
                field(integrationKey; Rec."Integration Key") { Caption = 'Integration Key'; }
                field(errorCategory; Rec."Error Category") { Caption = 'Error Category'; }
                field(retryCount; Rec."Retry Count") { Caption = 'Retry Count'; }
                field(processingStatus; Rec."Processing Status") { Caption = 'Processing Status'; }
                field(reprocessRequested; Rec."Reprocess Requested") { Caption = 'Reprocess Requested'; }
                field(systemId; Rec.SystemId) { Caption = 'Id'; }
            }
        }
    }
}
