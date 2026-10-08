/**
 * Hand-built fixture covering the edge cases found in the real 5.7 MB file.
 *
 *  1. rowspan spanning 4 rows (08:00 -> 11:50)
 *  2. dotted time label "11.00-11:50"
 *  3. "---" empty cell and "-X-" blocked cell
 *  4. subject with no dash at all:            "SMB12102 BAHASA ARAB 1"
 *  5. subject with no space after the dash:   "MMJ32703 -FLUID MACHINERY"
 *  6. combined codes:                         "IMJ41002/IMJ42004 - FINAL YEAR PROJECT 1 / 2"
 *  7. leading word that is not a code:        "TUTORIAL - EMJ26103 / EMJ26403 / EMJ26503"
 *  8. spaced code:                            "MMT 21704 - Automotive Modelling"
 *  9. MAKMAL in the tag must NOT read as LAB: "LAB FKTE 1 - LAB MN3E0 MAKMAL AUTOMASI"
 * 10. ONLINE only in the activity tag (no div.room)
 * 11. ONLINE only in div.room
 * 12. no div.room and no type in the tag -> venue taken from the tag tail
 * 13. two courses stacked in one slot
 * 14. cell with text but no div.line1 -> kept as `raw`
 * 15. no div.teacher
 * 16. colspan=2 body cell
 * 17. typo'd group label "UR6526001 - YIG3 (20)" plus a duplicate Y1G1 label
 */
export const EDGE_CASES_HTML = `<!DOCTYPE html>
<html lang="en-US">
  <head><meta charset="UTF-8" /><title>edge cases</title></head>
  <body id="top">
    <p><strong>Table of contents</strong></p>
    <ul>
      <li>
        Year (FKC) Bachelor of Computer Engineering with Honours
        <ul>
          <li>
            Group <a href="#table_2">UR6523002 - Y1G1 (25)</a>
          </li>
          <li>
            Group <a href="#table_4">UR6523002 - Y1G1 (25)</a>
          </li>
        </ul>
      </li>
      <li>
        Year (FKTA) Bachelor of Civil Engineering with Honours
        <ul>
          <li>
            Group <a href="#table_6">UR6526001 - YIG3 (20)</a>
          </li>
        </ul>
      </li>
      <li>
        Year (FKTE) Bachelor of Mechatronic Engineering with Honours
        <ul>
          <li>
            Group <a href="#table_8">UR6525001 - Y2G1 (30)</a>
          </li>
        </ul>
      </li>
      <li>
        Year (FKTM) Bachelor of Mechanical Engineering with Honours
        <ul>
          <li>
            Group <a href="#table_10">UR6524001 - Y3G1 (40)</a>
          </li>
        </ul>
      </li>
      <li>
        Year (FKTK) Bachelor of Material Engineering with Honours
        <ul>
          <li>
            Group <a href="#table_12">UR6527001 - Y4G1 (25)</a>
          </li>
        </ul>
      </li>
      <li>
        Year (FKTEN) Bachelor of Electronic Engineering with Honours
        <ul>
          <li>
            Group <a href="#table_14">UR6528001 - Y1G1 (30)</a>
          </li>
        </ul>
      </li>
      <li>
        Year (FPK) Bachelor of Accounting with Honours
        <ul>
          <li>
            Group <a href="#table_16">UR6231001 - Y1G1 (30)</a>
          </li>
        </ul>
      </li>
    </ul>
    <p>&nbsp;</p>

    <table id="table_2" border="1" class="odd_table">
      <caption><span class="institution">UNIVERSITI MALAYSIA PERLIS</span><br /><span class="name">UR6523002 - Y1G1 (25)</span></caption>
      <thead>
        <tr>
          <td></td>
          <th class="xAxis">MONDAY</th>
          <th class="xAxis">TUESDAY</th>
          <th class="xAxis">WEDNESDAY</th>
          <th class="xAxis">THURSDAY</th>
          <th class="xAxis">FRIDAY</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th class="yAxis">08:00-08:50</th>
          <td rowspan="4" class="c_1"><div class="studentsset line0">UR6523002 - Y1G1 (25), UR6523002 - Y1G2 (25)</div><div class="line1"><span class="subject">IMJ11203 - CIRCUIT THEORY 1</span><span class="activitytag"> LECTURE FKC (CE1)</span></div><div class="teacher line2">FKC - ROSEMIZI BIN ABD RAHIM, FKC - RUZELITA BINTI NGADIRAN</div><div class="room line3">PAUH PUTRA - DK 3 (400)</div></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">09:00-09:50</th>
          <!-- span -->
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">10:00-10:50</th>
          <!-- span -->
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">11.00-11:50</th>
          <!-- span -->
          <td class="empty"><span class="empty">---</span></td>
          <td class="c_2"><div class="studentsset line0">UR6523002 - Y1G1 (25)</div><div class="line1"><span class="subject">SMB12102 BAHASA ARAB 1</span><span class="activitytag"> LECTURE FKTE - ONLINE</span></div><div class="teacher line2">FKTE - SITI NUR HALIMAH BINTI HASSAN</div></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">12:00-12:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td rowspan="2" class="c_3">
            <div class="studentsset line0">UR6523002 - Y1G1 (25)</div>
            <div class="line1"><span class="subject">MMJ32703 -FLUID MACHINERY</span><span class="activitytag"> LAB FKTE 1 - LAB MN3E0 MAKMAL AUTOMASI</span></div>
            <div class="teacher line2">FKTE - NOR HAFIZAH BINTI MAT NASIR</div>
            <div class="room line3">FKTE - MAKMAL AUTOMASI &amp; PEMACU</div>
            <div class="line1"><span class="subject">IMJ41002/IMJ42004 - FINAL YEAR PROJECT 1 / 2</span><span class="activitytag"> TUTORIAL FKTA - BILIK TUTORIAL</span></div>
            <div class="teacher line2">FKTA - AHMAD BIN ABDULLAH</div>
            <div class="room line3">FKTA - BILIK TUTORIAL</div>
            <div class="line1"><span class="subject">TOTORIAL - EMJ16103 / EMJ16203 / EMJ16302</span><span class="activitytag"> FKTE 1 - LAB MN3C0 MAKMAL ROBOTIK</span></div>
            <div class="room line3">FKTE 1 - LAB MN3C0 - MAKMAL ROBOTIK</div>
          </td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="break"><span class="break">-X-</span></td>
        </tr>
        <tr>
          <th class="yAxis">13:00-13:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <!-- span -->
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="break"><span class="break">-X-</span></td>
        </tr>
        <tr>
          <th class="yAxis">14:00-14:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">15:00-15:50</th>
          <td colspan="2" class="c_4"><div class="studentsset line0">UR6523002 - Y1G1 (25)</div><div class="line1"><span class="subject">TUTORIAL - EMJ26103 / EMJ26403 / EMJ26503</span><span class="activitytag"> TUTORIAL FKTK -  MAKMAL PERANTI PERUBATAN (MN4E1)</span></div><div class="teacher line2">FKTK - SITI HAJAR BINTI ABDULLAH</div></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">16:00-16:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="c_5"><div class="studentsset line0">UR6523002 - Y1G1 (25)</div><div class="line1"><span class="subject">MMT 21704 - Automotive Modelling</span><span class="activitytag"> PAUH PUTRA  - DK 10 (200)</span></div><div class="teacher line2">FKTM - AHMAD NAZRUL BIN MAT NASIR</div></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">17:00-17:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="c_6"><div class="studentsset line0">UR6523002 - Y1G1 (25)</div><div class="line1"><span class="subject">IMQ10103 - ENGINEERING MATHEMATICS 1</span><span class="activitytag"> LECTURE ONLINE</span></div></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">18:00-18:50</th>
          <td class="c_7"><div class="studentsset line0">UR6523002 - Y1G1 (25)</div><div class="line1"><span class="subject">UNKNOWN SUBJECT WITHOUT CODE</span><span class="activitytag"> LECTURE FKC (CE1)</span></div><div class="teacher line2">FKC - SOMEONE</div><div class="room line3">PAUH PUTRA - DK 1 (100)</div></td>
          <td class="c_8"><div class="studentsset line0">UR6523002 - Y1G1 (25)</div>UNEXPECTED LAYOUT NO LINE1</td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr class="foot"><td></td><td colspan="5">Timetable generated with FET 7.10.5 on 10/8/26 7:47&#8239;PM</td></tr>
      </tbody>
    </table>

    <p class="back"><a href="#top">back to the top</a></p>

    <table id="table_4" border="1" class="even_table">
      <caption><span class="institution">UNIVERSITI MALAYSIA PERLIS</span><br /><span class="name">UR6523002 - Y1G1 (25)</span></caption>
      <thead>
        <tr>
          <td></td>
          <th class="xAxis">MONDAY</th>
          <th class="xAxis">TUESDAY</th>
          <th class="xAxis">WEDNESDAY</th>
          <th class="xAxis">THURSDAY</th>
          <th class="xAxis">FRIDAY</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th class="yAxis">08:00-08:50</th>
          <td class="c_9"><div class="studentsset line0">UR6523002 - Y1G1 (25)</div><div class="line1"><span class="subject">IMJ99999 - SECOND DUPLICATE LABEL GROUP</span><span class="activitytag"> LECTURE FKC (CE1)</span></div><div class="teacher line2">FKC - OTHER TEACHER</div><div class="room line3">PAUH PUTRA - DK 2 (100)</div></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">09:00-09:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">10:00-10:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">11.00-11:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">12:00-12:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">13:00-13:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">14:00-14:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">15:00-15:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">16:00-16:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">17:00-17:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">18:00-18:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr class="foot"><td></td><td colspan="5">Timetable generated with FET 7.10.5 on 10/8/26 7:47&#8239;PM</td></tr>
      </tbody>
    </table>

    <p class="back"><a href="#top">back to the top</a></p>

    <table id="table_6" border="1" class="odd_table">
      <caption><span class="institution">UNIVERSITI MALAYSIA PERLIS</span><br /><span class="name">UR6526001 - YIG3 (20)</span></caption>
      <thead>
        <tr>
          <td></td>
          <th class="xAxis">MONDAY</th>
          <th class="xAxis">TUESDAY</th>
          <th class="xAxis">WEDNESDAY</th>
          <th class="xAxis">THURSDAY</th>
          <th class="xAxis">FRIDAY</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th class="yAxis">08:00-08:50</th>
          <td class="c_10"><div class="studentsset line0">UR6526001 - YIG3 (20)</div><div class="line1"><span class="subject">KKH12303 - ENGINEERING DRAWING</span><span class="activitytag"> LAB FKTK - (FKTM C11 LAB)</span></div><div class="teacher line2">FKTK - LEE WEI CHIN</div><div class="room line3">FKTK - LAB FKTM C11</div></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">09:00-09:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">10:00-10:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">11.00-11:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">12:00-12:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">13:00-13:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">14:00-14:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">15:00-15:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">16:00-16:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">17:00-17:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">18:00-18:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr class="foot"><td></td><td colspan="5">Timetable generated with FET 7.10.5 on 10/8/26 7:47&#8239;PM</td></tr>
      </tbody>
    </table>

    <p class="back"><a href="#top">back to the top</a></p>

    <table id="table_8" border="1" class="even_table">
      <caption><span class="institution">UNIVERSITI MALAYSIA PERLIS</span><br /><span class="name">UR6525001 - Y2G1 (30)</span></caption>
      <thead>
        <tr>
          <td></td>
          <th class="xAxis">MONDAY</th>
          <th class="xAxis">TUESDAY</th>
          <th class="xAxis">WEDNESDAY</th>
          <th class="xAxis">THURSDAY</th>
          <th class="xAxis">FRIDAY</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th class="yAxis">08:00-08:50</th>
          <td class="c_11"><div class="studentsset line0">UR6525001 - Y2G1 (30)</div><div class="line1"><span class="subject">FKTE61303 - AUTOMATIC CONTROL</span><span class="activitytag"> LECTURE FKTEN-ONLINE7</span></div><div class="teacher line2">FKTEN - HASNAH BINTI HUSIN</div><div class="room line3">FKTEN-ONLINE7</div></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">09:00-09:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">10:00-10:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">11.00-11:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">12:00-12:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">13:00-13:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">14:00-14:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">15:00-15:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">16:00-16:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">17:00-17:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">18:00-18:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr class="foot"><td></td><td colspan="5">Timetable generated with FET 7.10.5 on 10/8/26 7:47&#8239;PM</td></tr>
      </tbody>
    </table>

    <p class="back"><a href="#top">back to the top</a></p>

    <table id="table_10" border="1" class="odd_table">
      <caption><span class="institution">UNIVERSITI MALAYSIA PERLIS</span><br /><span class="name">UR6524001 - Y3G1 (40)</span></caption>
      <thead>
        <tr>
          <td></td>
          <th class="xAxis">MONDAY</th>
          <th class="xAxis">TUESDAY</th>
          <th class="xAxis">WEDNESDAY</th>
          <th class="xAxis">THURSDAY</th>
          <th class="xAxis">FRIDAY</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th class="yAxis">08:00-08:50</th>
          <td class="c_12"><div class="studentsset line0">UR6524001 - Y3G1 (40)</div><div class="line1"><span class="subject">FKTM34303 - MECHANICAL DESIGN</span><span class="activitytag"> LECTURE-PPKB DKM 1</span></div><div class="teacher line2">FKTM - NORHAZILAH BINTI MAT YUSOFF</div><div class="room line3">PAUH PUTRA - DK 4 (400)</div></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">09:00-09:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">10:00-10:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">11.00-11:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">12:00-12:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">13:00-13:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">14:00-14:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">15:00-15:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">16:00-16:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">17:00-17:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">18:00-18:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr class="foot"><td></td><td colspan="5">Timetable generated with FET 7.10.5 on 10/8/26 7:47&#8239;PM</td></tr>
      </tbody>
    </table>

    <p class="back"><a href="#top">back to the top</a></p>

    <table id="table_12" border="1" class="even_table">
      <caption><span class="institution">UNIVERSITI MALAYSIA PERLIS</span><br /><span class="name">UR6527001 - Y4G1 (25)</span></caption>
      <thead>
        <tr>
          <td></td>
          <th class="xAxis">MONDAY</th>
          <th class="xAxis">TUESDAY</th>
          <th class="xAxis">WEDNESDAY</th>
          <th class="xAxis">THURSDAY</th>
          <th class="xAxis">FRIDAY</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th class="yAxis">08:00-08:50</th>
          <td class="c_13"><div class="studentsset line0">UR6527001 - Y4G1 (25)</div><div class="line1"><span class="subject">FKTK47602 - MATERIALS SELECTION</span><span class="activitytag"> FKTK FYP1 CONSULT/LABS</span></div><div class="teacher line2">FKTK - ROPITAH BINTI MAT HIJA</div><div class="room line3">FKTK - MAKMAL SIMULASI KOMPUTER (MEMS) A</div></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">09:00-09:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">10:00-10:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">11.00-11:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">12:00-12:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">13:00-13:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">14:00-14:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">15:00-15:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">16:00-16:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">17:00-17:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">18:00-18:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr class="foot"><td></td><td colspan="5">Timetable generated with FET 7.10.5 on 10/8/26 7:47&#8239;PM</td></tr>
      </tbody>
    </table>

    <p class="back"><a href="#top">back to the top</a></p>

    <table id="table_14" border="1" class="odd_table">
      <caption><span class="institution">UNIVERSITI MALAYSIA PERLIS</span><br /><span class="name">UR6528001 - Y1G1 (30)</span></caption>
      <thead>
        <tr>
          <td></td>
          <th class="xAxis">MONDAY</th>
          <th class="xAxis">TUESDAY</th>
          <th class="xAxis">WEDNESDAY</th>
          <th class="xAxis">THURSDAY</th>
          <th class="xAxis">FRIDAY</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th class="yAxis">08:00-08:50</th>
          <td class="c_14"><div class="studentsset line0">UR6528001 - Y1G1 (30)</div><div class="line1"><span class="subject">TEE21303 - ELECTRONIC DEVICES</span><span class="activitytag"> LECTURE FKTEN (60)</span></div><div class="teacher line2">FKTEN - SITI ZURAIDAH BINTI IBRAHIM</div><div class="room line3">FKTEN - DEWAN SERBAGUNA</div></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">09:00-09:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">10:00-10:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">11.00-11:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">12:00-12:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">13:00-13:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">14:00-14:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">15:00-15:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">16:00-16:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">17:00-17:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">18:00-18:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr class="foot"><td></td><td colspan="5">Timetable generated with FET 7.10.5 on 10/8/26 7:47&#8239;PM</td></tr>
      </tbody>
    </table>

    <p class="back"><a href="#top">back to the top</a></p>

    <table id="table_16" border="1" class="even_table">
      <caption><span class="institution">UNIVERSITI MALAYSIA PERLIS</span><br /><span class="name">UR6231001 - Y1G1 (30)</span></caption>
      <thead>
        <tr>
          <td></td>
          <th class="xAxis">MONDAY</th>
          <th class="xAxis">TUESDAY</th>
          <th class="xAxis">WEDNESDAY</th>
          <th class="xAxis">THURSDAY</th>
          <th class="xAxis">FRIDAY</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th class="yAxis">08:00-08:50</th>
          <td class="c_15"><div class="studentsset line0">UR6231001 - Y1G1 (30)</div><div class="line1"><span class="subject">ACC12303 - FINANCIAL ACCOUNTING</span><span class="activitytag"> LECTURE FPK</span></div><div class="teacher line2">FPK - NORLIZA BINTI MD NOOR</div><div class="room line3">PAUH PUTRA - DK 2 (200)</div></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">09:00-09:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">10:00-10:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">11.00-11:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">12:00-12:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">13:00-13:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">14:00-14:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">15:00-15:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">16:00-16:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">17:00-17:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr>
          <th class="yAxis">18:00-18:50</th>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
          <td class="empty"><span class="empty">---</span></td>
        </tr>
        <tr class="foot"><td></td><td colspan="5">Timetable generated with FET 7.10.5 on 10/8/26 7:47&#8239;PM</td></tr>
      </tbody>
    </table>
  </body>
</html>
`;