#import "@preview/shadowed:0.3.0": shadow
#import "colors.typ": colors-table

#set page(margin: 2cm)
#set text(size: 14pt)
#show table.cell.where(y: 0): set text(weight: "bold")

= Designing Themes

Designing official themes for Retlab follows some of rules.
This document tries to attempt how to create and maintain official themes.

Retlab uses _OKLCH_ color system because it is very easier to manage and work with.
And we follow some specific patterns in choosing the colors.

== Retman

Retman is the first, original & official theme for _Ret_.
Retman has two variants: _Light_ and _Dark_; for the corresponding theme environments.

= Colors

== Color Distribution

Here is how *color classes* used in rest of the document are defined:

#block(inset: (x: 12pt, y: 4pt), stroke: (left: 2pt))[
  / bg: For background areas.
  / text: Text and foreground.
  / border: Used for border and shadow purposes.
]

Colors are distributed like the following:

#table(
  stroke: (x: none),
  columns: (1fr, 1fr, 1fr, 1fr, 1fr, 1fr, 1fr, 1fr),
  align: (x, y) => if x == 0 { left } else { center },
  table.header()[Level][200][300][400][500][600][700][800],
  [*ACPA*], [90], [78], [65], [51], [65], [78], [90],
  [*Light*], [_bg_], [], [], [], [], [_border_], [_text_],
  [*Dark*], [_text_], [_border_], [], [], [], [], [_bg_],
  // [], [], [], [], [], [], [], [],
)

The following table shows how the color classes are distributed:

#table(
  columns: (1fr, 1fr, 1fr),
  table.header[Class][Light][Dark],
  table.cell(colspan: 3, fill: luma(230))[*_Area_*],
  [bg], [200], [800],
  [text], [800], [300],
  [border], [700], [200],
  table.cell(colspan: 3, fill: luma(230))[*_Buttons_*],
  [bg], [600], [400],
  [text], [200], [800],
)

== Color Tokens

Color groups used in _Ret_.

#colors-table
