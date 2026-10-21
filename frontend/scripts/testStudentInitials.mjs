import test from "node:test";
import assert from "node:assert/strict";
import { getStudentPhotoUrl, getStudentInitials, handleStudentPhotoError } from "../src/utils/fileUrl.js";
test("missing photo uses student initials and explicit empty photo fallback remains supported",()=>{
  assert.equal(getStudentInitials({firstName:"Arnav",lastName:"New"}),"AN");
  assert.match(decodeURIComponent(getStudentPhotoUrl({firstName:"Arnav",lastName:"New"})),/>AN<\/text>/);
  assert.equal(getStudentPhotoUrl({firstName:"Arnav"},""),"");
  const target={src:"broken",onerror:()=>{}};
  handleStudentPhotoError({currentTarget:target},{firstName:"Kanav",lastName:"New"});
  assert.match(decodeURIComponent(target.src),/>KN<\/text>/);
  assert.equal(target.onerror,null);
});
