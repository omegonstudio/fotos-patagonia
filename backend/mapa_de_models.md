erDiagram
    User }o--|| Role : "tiene un"
    User ||--o{ Cart : "tiene"
    User ||--o{ Order : "realiza"
    
    Photographer ||--o{ Photo : "toma"
    
    PhotoSession ||--o{ Photos : "contiene"
    
    Album ||--o{ PhotoSessions : "contiene"
    
    Cart ||--o{ CartItem : "contiene"
    Cart ||--|| SavedCart : "puede ser"
    
    Order ||--o{ OrderItem : "contiene"
    Order }o--|| Discount : "usa"
    
    %% Tablas de Unión (Junction Tables) %%
    CartItem }o--|| Photo : "referencia a"
    OrderItem }o--|| Photo : "referencia a"
