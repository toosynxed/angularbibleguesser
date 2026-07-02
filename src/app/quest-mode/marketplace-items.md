## Marketplace Items Categories:

# Item Choosing Process:
1. For *first item* randomly out of a category that fulfills:
    - Has at least *1 item* that has not been purchased yet **or** is not yet shown on marketplace board.
    - *IF* No items fulfilling these categories exist: show a blank, greyed out box showing:
        "No Items Available For Purchase!"

    - Categories are:
        1. Name Effect
        2. Nameplate
        3. Icon

2. Once selected a category, select an item still available/not shown already on board for selected category:
    - Name Effect:
        - Animated Rainbow
        - Glow
        - Bold
        - Underline
        - Italic

    - Nameplates:
        - Gold
        - Animated Fire
        - Ice
    
    - Icons:
        - Crown
        - Fire
        - Star
        - Cross
        - Dove
        - Crossed swords
        - Shield
        - Trophy
        - Medal

3. After each one is selected, must add the ID of the item to the User's DB collection to prevent duplicate shows.
4. Must also display the item price and background and description.
5. If bought, use *Bitwise Table* to store purchased items against user (See *Item Table* below for referencing).
6. When user's open profile customisation page/area, must check which Bitvalues are present for the user, and display the available options to that user.



# Item Table - Bitwise:
- Name Effect:
<!-->
    1 - Animated Rainbow
    2 - Glow
    4 - Bold
    8 - Underline
    16 - Italic
<!-->


- Nameplates:
<!-->
    32 - Gold
    64 - Animated Fire
    128 - Ice
<!-->

- Icons:
<!-->
    256 - Crown
    512 - Fire
    1024 - Star
    2048 - Cross
    4096 - Dove
    8192 - Crossed swords
    16384 - Shield
    32768 - Trophy
    65,536 - Medal
<!-->

