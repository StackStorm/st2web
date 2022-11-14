// Copyright 2021 The StackStorm Authors.
// Copyright 2020 Extreme Networks, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

//@flow

import type { TaskInterface, DeltaInterface } from '@stackstorm/st2flow-model';
import type { GenericError } from '@stackstorm/st2flow-model';
import type { NotificationInterface } from '@stackstorm/st2flow-notifications';

import React, { Component } from 'react';
// import { connect } from 'react-redux';
import { PropTypes } from 'prop-types';
import cx from 'classnames';

import ace from 'brace';
import 'brace/ext/language_tools';
import 'brace/mode/yaml';

import style from './style.css';

const Range = ace.acequire('ace/range').Range;
const editorId = 'editor_mount_point';
const DELTA_DEBOUNCE = 300; // ms
const DEFAULT_TAB_SIZE = 2;

const editorConnect = ({ ranges, notifications }) => ({ ranges, notifications });

export { editorConnect };

export default class Editor extends Component<{
  className?: string,
  ranges?: Object,
  notifications?: Array<NotificationInterface>,
  selectedTaskName?: string,
  onTaskSelect?: Function,
  source?: string,
  onEditorChange?: Function,
}> {
  static propTypes = {
    className: PropTypes.string,
    ranges: PropTypes.object,
    notifications: PropTypes.array,
    selectedTaskName: PropTypes.string,
    onTaskSelect: PropTypes.func,
    source: PropTypes.string,
    onEditorChange: PropTypes.func,
    onChange: PropTypes.func,
  }

  componentDidMount() {
    const { source } = this.props;
    ace.acequire('ace/ext/language_tools');

    this.editor = ace.edit(editorId);
    this.editor.$blockScrolling = Infinity;
    this.editor.setOptions({
      mode: 'ace/mode/yaml',
      useSoftTabs: true,
      showPrintMargin: false,
      highlightActiveLine: false,
    });

    this.editor.renderer.setPadding(10);
    this.editor.setValue(source || '', -1);
    this.setTabSize();
    this.editor.on('change', this.handleEditorChange);

    if(this.props.selectedTaskName) {
      this.mountCallback = setTimeout(() => {
        this.handleTaskSelect({ name: this.props.selectedTaskName });
      }, 20);
    }
  }

  componentDidUpdate(prevProps: Object) {
    const { selectedTaskName, source, notifications } = this.props;
    if (selectedTaskName !== prevProps.selectedTaskName) {
      this.handleTaskSelect({ name: selectedTaskName });
    }

    if (source && source !== prevProps.source) {
      this.handleModelChange([], source);
    }

    if (notifications && notifications !== prevProps.notifications) {
      this.handleModelError(notifications);
    }
  }

  componentWillUnmount() {
    window.clearTimeout(this.deltaTimer);
    this.editor.removeListener('change', this.handleEditorChange);

    if(this.mountCallback) {
      clearTimeout(this.mountCallback);
    }
  }

  setTabSize() {
    // const { model: { tokenSet } } = this.props;
    const tokenSet = false;

    this.editor.session.setTabSize(tokenSet ? tokenSet.indent.length : DEFAULT_TAB_SIZE);
  }

  handleTaskSelect(task: TaskInterface) {
    if(this.selectMarker) {
      this.editor.session.removeMarker(this.selectMarker);
    }

    if (!this.props.ranges) {
      return;
    }

    const [ start, end ] = this.props.ranges[task.name];
    const selection = new Range(start.row, 0, end.row, Infinity);
    const cursor = this.editor.selection.getCursor();

    if(selection.compare(cursor.row, cursor.column)) {
      this.editor.renderer.scrollCursorIntoView(start, 0.5);
    }
    else {
      this.editor.renderer.scrollCursorIntoView(cursor, 0.5);
    }

    this.selectMarker = this.editor.session.addMarker(selection, cx(this.style.activeTask), 'fullLine');

    if (this.props.onTaskSelect) {
      this.props.onTaskSelect(task);
    }
  }

  handleEditorChange = (delta: DeltaInterface) => {
    const { onChange } = this.props;
    window.clearTimeout(this.deltaTimer);

    // Only if the user is actually typing
    if(this.editor.isFocused()) {
      this.deltaTimer = window.setTimeout(() => {
        if (this.props.onEditorChange) {
          this.props.onEditorChange(this.editor.getValue());
          onChange();
        }
      }, DELTA_DEBOUNCE);
    }
  }

  handleModelChange = (deltas: Array<DeltaInterface>, yaml: string) => {
    this.clearErrorMarkers();
    this.editor.session.setAnnotations([]);

    if (yaml !== this.editor.getValue()) {
      // yaml was changed outside this editor
      this.editor.setValue(yaml, -1);
    }

    this.setTabSize();
  }

  handleModelError = (err: Array<GenericError>) => {
    const { session } = this.editor;
    const annotations = [];

    this.clearErrorMarkers();

    this.errorMarkers = err.filter(e => !!e.mark).map((e, i) => {
      const { row, column } = e.mark;
      const selection = new Range(row, 0, row, Infinity);

      annotations.push({
        row,
        column,
        type: 'warning',
        text: e.message,
      });

      return session.addMarker(selection, cx(this.style.errorLine), 'fullLine');
    });

    session.setAnnotations(annotations);
  }

  clearErrorMarkers() {
    if(this.errorMarkers && this.errorMarkers.length) {
      this.errorMarkers.forEach(m => this.editor.session.removeMarker(m));
    }
  }

  get notifications() {
    return this.props.notifications;
  }
  get errors() {
    return this.props.notifications ? this.props.notifications.filter(n => n.type === 'error') : [];
  }


  editor: any;
  selectMarker: any;
  errorMarkers: Array<any>;   // array of error markers
  deltaTimer = 0; // debounce timer
  mountCallback: any;

  style = style;

  render() {
    const { errors } = this;

    return (
      <div className={cx(this.props.className, this.style.component, { [this.style.hasError]: errors && errors.length })}>
        <div
          id={editorId}
          className={this.style.editor}
        />
      </div>
    );
  }
}
