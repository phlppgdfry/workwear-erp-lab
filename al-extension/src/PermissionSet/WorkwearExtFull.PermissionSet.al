permissionset 50100 "Workwear Ext - Full"
{
    Assignable = true;
    Caption = 'Workwear Extensions - Full Access';

    Permissions =
        tabledata "Brand Company Setup" = RIMD,
        tabledata "Brand Sales Buffer" = RIMD,
        tabledata "Brand Sync Exception" = RIMD,
        report "Cross-Brand Sales Consolid." = X,
        page "Brand Company Setup" = X,
        page "Brand Sales Overview" = X,
        page "Brand Sync Exceptions" = X,
        page "Brand Sync Exceptions API" = X;
}
