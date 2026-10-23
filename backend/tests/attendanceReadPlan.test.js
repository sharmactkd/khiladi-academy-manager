import test from "node:test";
import assert from "node:assert/strict";
import "mingo/init/system";
import { aggregate, Query } from "mingo";
import { compactImportedFeeContextStages, latestMetadataStages, IMPORTED_FEE_FIELDS } from "../src/utils/attendanceReadPlan.js";

const oldContextStages = [
  { $sort: { date: -1, updatedAt: -1 } }, { $limit: 40 }, { $unwind: "$records" },
  { $match: { $or: IMPORTED_FEE_FIELDS.map(field => ({ [`records.${field}`]: { $exists: true, $nin: [null, ""] } })) } },
  { $project: { _id: 0, student: "$records.student", ...Object.fromEntries(IMPORTED_FEE_FIELDS.map(field => [field, `$records.${field}`])) } },
];
const reduceContext = records => {
  const map = new Map();
  for (const record of records) {
    const id = String(record.student || "");
    if (!id) continue;
    const result = map.get(id) || { student: record.student };
    for (const field of IMPORTED_FEE_FIELDS) {
      if (!String(result[field] ?? "").trim() && String(record[field] ?? "").trim()) result[field] = record[field];
    }
    map.set(id, result);
  }
  return [...map.values()].sort((a,b) => String(a.student).localeCompare(String(b.student)));
};

test("compacted history preserves independent latest nonblank fields and 40-day horizon for 552 students", () => {
  const days = Array.from({length: 45}, (_, day) => ({
    date: new Date(Date.UTC(2026, 9, 23 - day)), updatedAt: new Date(Date.UTC(2026, 9, 23 - day)),
    records: Array.from({length: 552}, (_, student) => ({
      student: `s-${student}`, status: "present", importedName: `Student ${student}`,
      importedDueDate: day % 5 === 0 ? " " : day % 3 === 0 ? `${day}-10-2026` : "",
      importedPaidDate: day === 2 ? "15-10-2026" : "",
      importedFeePaid: day === 3 ? "800" : "",
      importedFeeStatus: day === 4 ? (student % 2 ? "DUE" : "PAID") : "",
    })),
  }));
  // Only the excluded oldest day knows this student. It must stay excluded.
  days[44].records.push({student:"outside-horizon",importedFeeStatus:"PAID"});
  const oldRecords = aggregate(days, oldContextStages);
  const compact = aggregate(days, compactImportedFeeContextStages());
  assert.deepEqual(reduceContext(compact), reduceContext(oldRecords));
  assert.equal(compact.length, 552);
  assert(oldRecords.length > compact.length * 10);
  assert(!compact.some(record => record.student === "outside-horizon"));
  assert(!JSON.stringify(compact).includes("importedName"));
});

test("metadata sorting once preserves the old per-field latest values, including blanks and ties", () => {
  const fields = [...IMPORTED_FEE_FIELDS, "importedExtraNote"];
  const docs = [
    { student:"a", updatedAt:new Date("2026-10-03"), importedDueDate:"", importedPaidDate:"03-10-2026" },
    { student:"a", updatedAt:new Date("2026-10-02"), importedDueDate:"21-10-2026", importedFeeStatus:"DUE" },
    { student:"a", updatedAt:new Date("2026-10-01"), importedDueDate:"10-10-2026", importedFeeStatus:"PAID" },
    { student:"b", updatedAt:new Date("2026-10-03"), importedExtraNote:"Note", importedFeePaid:"0" },
    { student:"b", updatedAt:new Date("2026-10-03"), importedExtraNote:"Older tie", importedFeePaid:"100" },
  ];
  const old = [{ $facet: Object.fromEntries(fields.map(field => [field, [
    { $match:{[field]:{$exists:true,$nin:[null,""]}} }, { $sort:{updatedAt:-1} },
    { $group:{_id:"$student",student:{$first:"$student"},[field]:{$first:`$${field}`}} },
    { $project:{_id:0,student:1,[field]:1} },
  ]])) }];
  assert.deepEqual(aggregate(docs,latestMetadataStages()),aggregate(docs,old));
});

test("register keeps saved order, historical blanks, inactive and former batch students without rereading roster IDs", async t => {
  process.env.MONGO_URI ||= "mongodb://127.0.0.1:27017/khiladi_unit_test";
  process.env.JWT_ACCESS_SECRET ||= "unit-test-access-at-least-32-characters";
  process.env.JWT_REFRESH_SECRET ||= "unit-test-refresh-at-least-32-characters";
  const {default:mongoose}=await import("mongoose");
  const models={};
  for(const name of ["Student","Batch","Attendance","AttendanceDayNote","AttendanceRowOrder","AttendanceMonthMetadata","FeePayment","StudentMembership","MembershipAdjustment"])
    models[name]=(await import(`../src/models/${name}.js`)).default;
  const {getMonthlyAttendanceRegister}=await import("../src/services/monthlyAttendanceService.js");
  const {todayDateKey}=await import("../src/utils/businessDate.js");
  const [year,month]=todayDateKey().split("-").map(Number);
  const id=()=>new mongoose.Types.ObjectId(),academy=id(),batch=id(),a=id(),b=id(),former=id();
  const students=[
    {_id:a,academy,batch,firstName:"Synthetic A",status:"active",createdAt:new Date("2020-01-01")},
    {_id:b,academy,batch,firstName:"Synthetic B",status:"inactive",createdAt:new Date("2020-01-02")},
    {_id:former,academy,batch:id(),firstName:"Former",status:"inactive",createdAt:new Date("2020-01-03")},
  ];
  const previous=new Date(Date.UTC(year,month-2,1));
  const previousYear=previous.getUTCFullYear(),previousMonth=previous.getUTCMonth()+1;
  const attendances=[{academy,batch,date:new Date(Date.UTC(year,month-1,1)),records:[
    {student:a,status:"present"},{student:b,status:"absent"},{student:former,status:"leave"},
  ]},{academy,batch,date:previous,records:[
    {student:a,status:"present",source:"excel-import",importedPaidDate:"old text",importedFeeStatus:"PAID"},
  ]}];
  const metadata=[{academy,batch,student:a,year:previousYear,month:previousMonth,updatedAt:new Date(),
    importedDueDate:"",importedPaidDate:"",importedFeeStatus:"",importedFeePaid:""}];
  const chain=rows=>({select(){return this;},sort(spec){rows=aggregate(rows,[{$sort:spec}]);return this;},lean(){return Promise.resolve(rows);}});
  const queries=[];
  t.mock.method(models.Student,"find",query=>{
    queries.push(query);
    // Mongoose casts $in strings to ObjectIds; emulate that at this boundary.
    return chain(query._id ? students.filter(student => String(student.academy)===String(query.academy) && query._id.$in.includes(String(student._id))) : new Query(query).find(students).all());
  });
  t.mock.method(models.Batch,"findOne",()=>chain({_id:batch,batchName:"Synthetic"}));
  t.mock.method(models.Attendance,"find",query=>chain(new Query(query).find(attendances).all()));
  t.mock.method(models.Attendance,"aggregate",pipeline=>Promise.resolve(aggregate(attendances,pipeline)));
  t.mock.method(models.AttendanceDayNote,"find",()=>chain([]));
  const keys=[`student:${b}`,`student:${a}`,`student:${former}`];
  t.mock.method(models.AttendanceRowOrder,"findById",()=>chain({keys,revision:2,snapshotSource:"explicit-save",statuses:{[`student:${b}`]:"inactive"}}));
  t.mock.method(models.AttendanceMonthMetadata,"find",query=>chain(new Query(query).find(metadata).all()));
  t.mock.method(models.AttendanceMonthMetadata,"aggregate",pipeline=>Promise.resolve(aggregate(metadata,pipeline)));
  t.mock.method(models.FeePayment,"find",()=>chain([]));
  t.mock.method(models.FeePayment,"aggregate",()=>Promise.resolve([]));
  t.mock.method(models.StudentMembership,"find",()=>chain([]));
  t.mock.method(models.MembershipAdjustment,"aggregate",()=>Promise.resolve([]));
  const current=await getMonthlyAttendanceRegister({academyId:academy,batchId:batch,year,month});
  assert.deepEqual(current.rows.map(row=>row.registerOrderKey),keys);
  assert.equal(current.rows.find(row=>row.studentId===String(b)).status,"inactive");
  const aRow=current.rows.find(row=>row.studentId===String(a));
  assert.equal(aRow.attendance[`${year}-${String(month).padStart(2,"0")}-01`],"P");
  assert.equal(current.rows.length,3);
  const historical=await getMonthlyAttendanceRegister({academyId:academy,batchId:batch,year:previousYear,month:previousMonth});
  const oldRow=historical.rows.find(row=>row.studentId===String(a));
  assert.equal(oldRow.feePaidDate,null);assert.equal(oldRow.feeDueDate,null);assert.equal(oldRow.feeStatus,"");
  assert.deepEqual(historical.rows.map(row=>row.registerOrderKey),keys);
  for(const query of queries.filter(query=>query._id)) {
    assert.deepEqual(query._id.$in,[String(former)]);
    assert.equal(String(query.academy),String(academy));
  }
});
