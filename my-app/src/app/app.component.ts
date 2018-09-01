import {Component, Injectable} from '@angular/core';
import {SelectionModel} from '@angular/cdk/collections';
import {FlatTreeControl} from '@angular/cdk/tree';
import {MatTreeFlatDataSource, MatTreeFlattener} from '@angular/material/tree';
import {BehaviorSubject, Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged} from "rxjs/operators";
import * as _ from 'lodash';

export class TodoItemNode {
  children: TodoItemNode[];
  name: string;
  id: string;
}

export class TodoItemFlatNode {
  name: string;
  level: number;
  id: string;
  expandable: boolean;
}

const TREE_DATA = [
  { 'id': '15305130530', 'name': '分组一', 'children':
      [ { 'id': '1@DEFAULT', 'name': '1-001' },
        { 'id': '2@DEFAULT', 'name': '1-002' },
        { 'id': '5@DEFAULT', 'name': '1-003' }
      ]},
  { 'id': '15305130801', 'name': '分组二', 'children':
        [ { 'id': '0@DEFAULT', 'name': '2-001' },
          { 'id': '3@DEFAULT', 'name': '2-002' },
          { 'id': '4@DEFAULT', 'name': '2-003' } ] }
          ];

@Injectable()
export class ChecklistDatabase {
  dataChange = new BehaviorSubject<TodoItemNode[]>([]);

  get data(): TodoItemNode[] { return this.dataChange.value; }

  constructor() {
    this.initialize();
  }

  initialize() {
    const data = this.buildFileTree(TREE_DATA);
    this.dataChange.next(data);
  }

  buildFileTree(items: Array<any>): TodoItemNode[] {
    let data: any[]= [];
    items.forEach(item=>{
      const node = new TodoItemNode();
      node.name = item['name'];
      node.id = item['id'];
      if(item.children != null){
          node.children = this.buildFileTree(item.children);
      }
      data.push(node);

    });
    return data;
  }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [ChecklistDatabase],
  host: {
    '(document:click)': 'onClick($event)',
  }
})
export class AppComponent {

  flatNodeMap = new Map<TodoItemFlatNode, TodoItemNode>();
  nestedNodeMap = new Map<TodoItemNode, TodoItemFlatNode>();
  treeControl: FlatTreeControl<TodoItemFlatNode>;
  treeFlattener: MatTreeFlattener<TodoItemNode, TodoItemFlatNode>;
  dataSource: MatTreeFlatDataSource<TodoItemNode, TodoItemFlatNode>;
  cameraTreeShow: boolean;
  dataNodes: Array<TodoItemFlatNode>;
  /** The selection for checklist */
  checklistSelection = new customSelectionModule<TodoItemFlatNode>(true /* multiple */);

  constructor(private database: ChecklistDatabase) {
    this.cameraTreeShow = false;
    this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel,
      this.isExpandable, this.getChildren);
    this.treeControl = new FlatTreeControl<TodoItemFlatNode>(this.getLevel, this.isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
    this.dataNodes = [];
    database.dataChange.subscribe(data => {
      this.dataSource.data = data;
      this.dataNodes = JSON.parse(JSON.stringify(this.dataSource.data))
      // window.setTimeout(function(){
      //   Object.assign(_this.dataNodes, _this.dataSource.data)

      // },0)
    });

    this.searchFilter.pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(value => {
        if (value && value.length >= 2) {
          this.filterByName(value);
        } else {
          this.clearFilter();
        }
      });
  }

  getLevel = (node: TodoItemFlatNode) => node.level;

  isExpandable = (node: TodoItemFlatNode) => node.expandable;

  getChildren = (node: TodoItemNode): TodoItemNode[] => node.children;

  hasChild = (_: number, _nodeData: TodoItemFlatNode) => _nodeData.expandable;



  /**
   * Transformer to convert nested node to flat node. Record the nodes in maps for later use.
   */
  transformer = (node: TodoItemNode, level: number) => {
    const existingNode = this.nestedNodeMap.get(node);
    const flatNode = existingNode && existingNode.name === node.name
      ? existingNode
      : new TodoItemFlatNode();
    flatNode.name = node.name;
    flatNode.id = node.id;
    flatNode.level = level;
    flatNode.expandable = !!node.children;
    this.flatNodeMap.set(flatNode, node);
    this.nestedNodeMap.set(node, flatNode);
    return flatNode;
  }

  /** Whether all the descendants of the node are selected */
  descendantsAllSelected(node: TodoItemFlatNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    return descendants.every(child => this.checklistSelection.isSelected(child));
  }

  /** Whether part of the descendants are selected */
  descendantsPartiallySelected(node: TodoItemFlatNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const result = descendants.some(child => this.checklistSelection.isSelected(child));
    return result && !this.descendantsAllSelected(node);
  }

  /** Toggle the to-do item selection. Select/deselect all the descendants node */
  todoItemSelectionToggle(node: TodoItemFlatNode): void {
    this.checklistSelection.toggle(node);
    const descendants = this.treeControl.getDescendants(node);
    this.checklistSelection.isSelected(node)
      ? this.checklistSelection.select(...descendants)
      : this.checklistSelection.deselect(...descendants);
  }

  onClick(event) {
    if(document.getElementById("cameraTree")){
      if(!document.getElementById("cameraTree").contains(event.target)){
        this.cameraTreeShow = false;
      }
    }
  }

  clearFilter(): void {
    this.dataSource.data = this.dataNodes;
    this.checklistSelection.selected.forEach(item=>{
      this.checklistSelection.select(item)
    })
    this.treeControl.expandAll();
  }

  filterByName(term: string): void {
    let filterlist = [];
    let result = [];

    filterlist = JSON.parse(JSON.stringify(this.dataNodes))
    for(var i=0; i<filterlist.length; i++){
      result.push(this.filtering(term, filterlist[i], filterlist));
    }
    this.dataSource.data = result.filter(item=>item);

    this.checklistSelection.selected.forEach(item=>{
      this.checklistSelection.select(item)
    })
    //this.checklistSelection.select(this.checklistSelection.selected[0])

    this.treeControl.expandAll();
  }

  filtering(term: string, node: Object, list: Array<Object>): Array<Object>{
      if(node.children && node.name.indexOf(term) >-1){
     
        return node;
      }
      if(node.children){
        for(var i=0; i<node.children.length; i++){
          node.children = this.filtering(term, node.children[i], node.children);
        }
        if(node.children.length == 0 && node.name.indexOf(term) <0){
          return null;
        }
        else{

          return node;
        }
      }
      else{
        let result = list.filter(item => item.name.indexOf(term) > 0);
        return result;
      }
  }

  selectAll(): void{
    const nodes = this.treeControl.dataNodes;
    nodes.forEach(node=>{
      this.checklistSelection.select(node)
      const descendants = this.treeControl.getDescendants(node);
      descendants.forEach( child=> this.checklistSelection.select(child));
    })
  }

  reset(): void{
    const nodes = this.treeControl.dataNodes;
    nodes.forEach(node=>{
      this.checklistSelection.clear();
      const descendants = this.treeControl.getDescendants(node);
      descendants.forEach( child=> this.checklistSelection.clear());
    })
  }


  filterChanged(keyword: string):void{
    this.searchFilter.next(keyword);
  }

  showCameraSelection():void{
    this.cameraTreeShow = !this.cameraTreeShow;
    event.stopPropagation();
  }

  searchFilter: Subject<string> = new Subject<string>();

}

export class customSelectionModule<T> extends SelectionModel<T> {
  constructor(multiple: boolean) {
    super(multiple);
  }

  private getSelectedCount() {
    let selectedItems = this.selected;
    return selectedItems.filter(item=> item instanceof TodoItemFlatNode && item.level!= 0).length;
  }
}
