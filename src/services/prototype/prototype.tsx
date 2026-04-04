

// interface Array<T> {
//     sortToFirstReact(fun: (item: T) => boolean): Array<T>;
// }

// Array.prototype.sortToFirstReact = function (fun: (item: any[]) => boolean) {
//     const index = this.findIndex(fun);
//     if (index > -1) {
//         const element = this[index];
//         this.splice(index, 1);
//         this.unshift(element);
//     }
//     return this;
// }