// 星寰海 v2.0 - memory-body 记忆关系图谱
import type { MoodEntry } from '../types/memoryBodyTypes';

/** 节点类型 */
export type NodeType = 'mood' | 'emergency' | 'event' | 'intervention' | 'pattern';

/** 边类型（关系类型） */
export type EdgeType = 'cause_effect' | 'temporal' | 'emotional' | 'contextual' | 'similarity';

/** 图节点接口 */
export interface GraphNode<T> {
  id: string;
  type: NodeType;
  data: T;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

/** 图边接口 */
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  weight: number; // 0-1，表示关系强度
  properties?: Record<string, unknown>;
  createdAt: Date;
}

/** MemoryGraph 类 - 管理记忆之间的关系图谱 */
export class MemoryGraph {
  private nodes: Map<string, GraphNode<unknown>> = new Map();
  private edges: Map<string, GraphEdge> = new Map();
  private nodeIndex: Map<string, Set<string>> = new Map(); // 按类型索引

  /** 添加节点 */
  addNode<T>(node: Omit<GraphNode<T>, 'createdAt'> & { createdAt?: Date }): GraphNode<T> {
    const fullNode: GraphNode<T> = {
      ...node,
      createdAt: node.createdAt || new Date(),
    } as GraphNode<T>;

    this.nodes.set(fullNode.id, fullNode as GraphNode<unknown>);

    // 更新索引
    if (!this.nodeIndex.has(fullNode.type)) {
      this.nodeIndex.set(fullNode.type, new Set());
    }
    this.nodeIndex.get(fullNode.type)!.add(fullNode.id);

    return fullNode;
  }

  /** 添加边 */
  addEdge(edge: Omit<GraphEdge, 'id' | 'createdAt'> & { id?: string; createdAt?: Date }): GraphEdge {
    const fullEdge: GraphEdge = {
      id: edge.id || `${edge.source}-${edge.target}-${Date.now()}`,
      source: edge.source,
      target: edge.target,
      type: edge.type,
      weight: Math.min(Math.max(edge.weight, 0), 1),
      properties: edge.properties,
      createdAt: edge.createdAt || new Date(),
    };

    this.edges.set(fullEdge.id, fullEdge);
    return fullEdge;
  }

  /** 获取节点 */
  getNode<T>(id: string): GraphNode<T> | undefined {
    const node = this.nodes.get(id);
    return node ? (node as GraphNode<T>) : undefined;
  }

  /** 获取所有节点 */
  getAllNodes(): GraphNode<unknown>[] {
    return Array.from(this.nodes.values());
  }

  /** 按类型获取节点 */
  getNodesByType<T>(type: NodeType): GraphNode<T>[] {
    const nodeIds = this.nodeIndex.get(type);
    if (!nodeIds) return [];

    return Array.from(nodeIds)
      .map(id => this.nodes.get(id))
      .filter(Boolean)
      .map(node => node as GraphNode<T>);
  }

  /** 获取与指定节点相连的所有节点 */
  getConnected<T>(nodeId: string, maxDepth: number = 1): GraphNode<T>[] {
    const visited = new Set<string>();
    const result: GraphNode<T>[] = [];

    const traverse = (currentId: string, depth: number) => {
      if (depth > maxDepth || visited.has(currentId)) return;
      visited.add(currentId);

      const node = this.nodes.get(currentId);
      if (node) {
        result.push(node as GraphNode<T>);
      }

      // 查找相邻节点
      const connectedEdges = this.findEdgesByNode(currentId);
      for (const edge of connectedEdges) {
        const nextId = edge.source === currentId ? edge.target : edge.source;
        traverse(nextId, depth + 1);
      }
    };

    traverse(nodeId, 0);
    return result;
  }

  /** 获取两个节点之间的关系 */
  getRelationship(sourceId: string, targetId: string): GraphEdge | undefined {
    for (const edge of this.edges.values()) {
      if (
        (edge.source === sourceId && edge.target === targetId) ||
        (edge.source === targetId && edge.target === sourceId)
      ) {
        return edge;
      }
    }
    return undefined;
  }

  /** 查找与指定节点相关的所有边 */
  private findEdgesByNode(nodeId: string): GraphEdge[] {
    return Array.from(this.edges.values()).filter(
      edge => edge.source === nodeId || edge.target === nodeId
    );
  }

  /** 查找因果链 */
  findCauseEffectChain(startId: string, maxLength: number = 5): GraphNode<unknown>[] {
    const chain: GraphNode<unknown>[] = [];
    let currentId = startId;

    for (let i = 0; i < maxLength; i++) {
      const node = this.nodes.get(currentId);
      if (!node) break;
      chain.push(node);

      // 查找因果关系的下一个节点
      const causeEdges = Array.from(this.edges.values())
        .filter(e => e.source === currentId && e.type === 'cause_effect')
        .sort((a, b) => b.weight - a.weight);

      if (causeEdges.length > 0) {
        currentId = causeEdges[0].target;
      } else {
        break;
      }
    }

    return chain;
  }

  /** 查找时间序列 */
  findTemporalSequence(startTime: Date, endTime: Date, type?: NodeType): GraphNode<unknown>[] {
    return Array.from(this.nodes.values())
      .filter(node => {
        if (type && node.type !== type) return false;
        const nodeTime = node.createdAt.getTime();
        return nodeTime >= startTime.getTime() && nodeTime <= endTime.getTime();
      })
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  /** 查找相似情绪模式 */
  findSimilarMoodPatterns(mood: string, threshold: number = 0.7): Array<{
    node: GraphNode<MoodEntry>;
    similarity: number;
    connections: GraphEdge[];
  }> {
    const moodNodes = this.getNodesByType<MoodEntry>('mood');
    const results: Array<{ node: GraphNode<MoodEntry>; similarity: number; connections: GraphEdge[] }> = [];

    for (const node of moodNodes) {
      if (node.data.mood === mood) continue;

      // 计算相似度
      const similarity = this.calculateMoodSimilarity(node.data, mood);
      if (similarity >= threshold) {
        const connections = this.findEdgesByNode(node.id);
        results.push({ node, similarity, connections });
      }
    }

    return results.sort((a, b) => b.similarity - a.similarity);
  }

  /** 计算情绪相似度 */
  private calculateMoodSimilarity(entry: MoodEntry, targetMood: string): number {
    let score = 0;

    // 情绪极性相似（简化版：正面vs负面）
    const positiveMoods = ['happy', 'joyful', 'grateful', 'hopeful', 'calm', 'relaxed', 'confident'];
    const isPositive = positiveMoods.includes(entry.mood);
    const targetIsPositive = positiveMoods.includes(targetMood);
    if (isPositive === targetIsPositive) score += 0.3;

    // 强度接近
    const intensityDiff = Math.abs(entry.intensity - 5); // 假设目标强度为5
    score += Math.max(0, 0.4 - intensityDiff * 0.04);

    // 情境重叠
    if (entry.context && entry.context.length > 0) {
      score += 0.3;
    }

    return Math.min(score, 1.0);
  }

  /** 获取节点的统计信息 */
  getStats(): {
    totalNodes: number;
    totalEdges: number;
    nodesByType: Record<NodeType, number>;
    edgesByType: Record<EdgeType, number>;
  } {
    const nodesByType: Record<NodeType, number> = {
      mood: 0, emergency: 0, event: 0, intervention: 0, pattern: 0,
    };
    const edgesByType: Record<EdgeType, number> = {
      cause_effect: 0, temporal: 0, emotional: 0, contextual: 0, similarity: 0,
    };

    for (const node of this.nodes.values()) {
      nodesByType[node.type]++;
    }

    for (const edge of this.edges.values()) {
      edgesByType[edge.type]++;
    }

    return {
      totalNodes: this.nodes.size,
      totalEdges: this.edges.size,
      nodesByType,
      edgesByType,
    };
  }

  /** 删除节点及其相关边 */
  removeNode(id: string): void {
    // 删除相关边
    const relatedEdges = this.findEdgesByNode(id);
    for (const edge of relatedEdges) {
      this.edges.delete(edge.id);
    }

    // 删除节点
    this.nodes.delete(id);

    // 更新索引
    const node = this.nodes.get(id);
    if (node) {
      const typeSet = this.nodeIndex.get(node.type);
      if (typeSet) {
        typeSet.delete(id);
      }
    }
  }

  /** 清空图谱 */
  clear(): void {
    this.nodes.clear();
    this.edges.clear();
    this.nodeIndex.clear();
  }
}
